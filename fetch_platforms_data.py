# script: fetch_platforms_data.py
import pandas as pd
import requests

def get_l06_codes_and_labels():
    url = "http://vocab.nerc.ac.uk/collection/L06/current/?_profile=nvs&_mediatype=application/ld+json"
    print(f"Fetching from: {url}")
    
    res = requests.get(url)

    print("HTTP status code:", res.status_code)
    print("Response preview:")
    print(res.text[:500])  # Affiche les 500 premiers caractères

    if res.status_code != 200:
        raise Exception(f"Failed to fetch data from {url} (HTTP {res.status_code})")

    json_data = res.json()
    if "@graph" not in json_data:
        raise Exception("Missing '@graph' in JSON response")

    platforms = json_data["@graph"]
    platforms_parsed = {}
    l06Lookup = {}

    for platform in platforms:
        pref_label = platform.get("skos:prefLabel", "")
        label = pref_label.get("@value") if isinstance(pref_label, dict) else pref_label
        if not label:
            continue
        broader = platform.get("skos:broader", [])
        id = platform["@id"]
        found_parent_platform = False
        for b in broader:
            if "L06" in b["@id"]:
                platforms_parsed[id] = {
                    "broader_L06_url": b["@id"],
                    "l06_label": label,
                }
                found_parent_platform = True
        if not found_parent_platform:
            platforms_parsed[id] = {
                "broader_L06_url": id,
                "l06_label": label,
            }
        l06Lookup[id] = label

    for l06_url_code, item in platforms_parsed.items():
        broaderL06 = item["broader_L06_url"]
        item["category"] = l06Lookup.get(broaderL06, "")

    df = pd.DataFrame.from_dict(platforms_parsed, orient="index")
    if "broader_L06_url" in df.columns:
        del df["broader_L06_url"]

    # 🔧 Correction ici : extraire proprement le code
    df.index = df.index.astype(str).str.split("/").str[-2]
    df.index.names = ["l06_code"]

    print("l06_df columns:", df.columns)
    print(df.head())

    return df

def get_ioos_to_l06_mapping():
    url = "https://mmisw.org/ont/api/v0/ont?format=jsonld&iri=http://mmisw.org/ont/bodc/MapSeaVoxPlatforms2IOOSandRDIPlatforms"
    res = requests.get(url).json()
    rows = []
    for k in res["@graph"]:
        try:
            predicate = k.get("predicate", "").split(":")[-1]
            ioos_code = k.get("subject", "").split("/")[-1]
            nerc_l06_code = k.get("object", "").split("/")[-2]

            if ioos_code and nerc_l06_code:
                rows += [
                    {"ioos_label": ioos_code, "predicate": predicate, "l06_code": nerc_l06_code}
                ]
        except IndexError:
            pass

    df = pd.DataFrame(rows)
    preference_list = ["exactMatch", "narrowMatch", "broadMatch", "relatedMatch"]
    df["Pref"] = pd.Categorical(df["predicate"], categories=preference_list, ordered=True)
    df = df.sort_values(["ioos_label", "Pref"]).drop_duplicates("ioos_label")
    df.drop(["Pref", "predicate"], axis=1, inplace=True)
    df.reset_index(inplace=True, drop=True)
    df = df.set_index("l06_code")
    return df

l06_df = get_l06_codes_and_labels()
ioos_df = get_ioos_to_l06_mapping()

platforms_nerc_ioos = (
    l06_df.reset_index()
    .merge(ioos_df.reset_index(), on="l06_code", how="left")
    .fillna("")
)

print("l06_df columns:", l06_df.columns)
print("l06_df sample:")
print(l06_df.head())

platforms_nerc_ioos.to_csv("platforms_nerc_ioos.csv", index=False)
