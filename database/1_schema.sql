/* 
    Create the tables
 
 */


-- We are using features from PostGIS 3
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE schema cde;

SET search_path TO cde, public;

DROP TABLE IF EXISTS hexes_zoom_0;
CREATE TABLE hexes_zoom_0 (
    pk serial PRIMARY KEY,
    geom geometry(Polygon,3857)
);  

DROP TABLE IF EXISTS hexes_zoom_1;
CREATE TABLE hexes_zoom_1 (
    pk serial PRIMARY KEY,
    geom geometry(Polygon,3857)
  );

 

-- The harvester will skip datasets in this table
DROP TABLE IF EXISTS skipped_datasets;
CREATE TABLE skipped_datasets (
    pk serial PRIMARY KEY,
    dataset_id text,
    erddap_url text
);

-- ERDDAP Datasets
DROP TABLE IF EXISTS datasets;
CREATE TABLE datasets (
    pk serial PRIMARY KEY,
    pk_url INTEGER,
    dataset_id TEXT,
    erddap_url TEXT,
    platform TEXT,
    title TEXT,
    title_fr TEXT,
    summary TEXT,
    summary_fr TEXT,
    cdm_data_type text,
    organizations text[],
    eovs text[],
    ckan_id text,
    timeseries_id_variable text,
    profile_id_variable text,
    trajectory_id_variable text,
    organization_pks INTEGER[],
    n_profiles integer,
    profile_variables text[],
    num_columns integer,
    first_eov_column TEXT,
    UNIQUE(dataset_id, erddap_url)
);

-- List of organizations to show in CDE, from CKAN, can be many per dataset
DROP TABLE IF EXISTS organizations;
CREATE TABLE organizations (
    pk SERIAL PRIMARY KEY,
    pk_url INTEGER,
    name TEXT UNIQUE,
    color TEXT
);



-- One record per unique lat/long
-- this table is mostly used to build hexes, its not queried by the API
DROP TABLE IF EXISTS points;
CREATE TABLE points (
    pk serial PRIMARY KEY,
    geom geometry(Point,3857),
    -- these values are copied back into profiles
    hex_zoom_0 geometry(Polygon,3857),
    hex_zoom_1 geometry(Polygon,3857),
    hex_0_pk integer,
    hex_1_pk integer
);

CREATE INDEX
  ON points
  USING GIST (geom);

CREATE INDEX hex_zoom_0
ON cde.points
USING GIST (geom);

CREATE INDEX hex_zoom_1
ON cde.points
USING GIST (geom);


-- profiles/timeseries per dataset
DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
    pk serial PRIMARY KEY,
    geom geometry(Point,3857),
    dataset_pk integer REFERENCES datasets(pk),
    erddap_url text,
    dataset_id text,
    timeseries_id text,
    profile_id text,
    time_min timestamptz,
    time_max timestamptz,
    latitude double precision,
    longitude double precision,
    depth_min double precision,
    depth_max double precision,
    n_records bigint,
    records_per_day float,
    n_profiles bigint,
    -- hex polygon that this point is in for zoom 0 (zoomed out)
    hex_zoom_0 geometry(polygon,3857),
    hex_zoom_1 geometry(polygon,3857),
    hex_0_pk integer,
    hex_1_pk integer,
    point_pk INTEGER,
    days bigint,
    UNIQUE(erddap_url,dataset_id,timeseries_id,profile_id)
);

CREATE INDEX ON profiles USING GIST (geom);
CREATE INDEX ON profiles USING GIST (hex_zoom_0);
CREATE INDEX ON profiles USING GIST (hex_zoom_1);
CREATE INDEX ON profiles(latitude);
CREATE INDEX ON profiles(longitude);




--
DROP TABLE IF EXISTS download_jobs;
CREATE TABLE download_jobs (
    pk SERIAL PRIMARY KEY,
    time timestamp with time zone DEFAULT now(),
    job_id text,
    email text,
    status text DEFAULT 'open'::text,
    time_total interval generated always as (time_complete - "time") stored,
    download_size numeric,
    estimate_size numeric,
    estimate_details text,
    erddap_report text,
    time_start timestamp with time zone,
    time_complete timestamp with time zone,
    downloader_input text,
    downloader_output text
);

DROP TABLE IF EXISTS skipped_datasets;
CREATE TABLE skipped_datasets (
    erddap_url text,
    dataset_id text,
    reason_code text
);

DROP TABLE IF EXISTS cde.organizations_lookup;
CREATE TABLE cde.organizations_lookup (
    pk SERIAL PRIMARY KEY,
    name TEXT UNIQUE
);

DROP TABLE IF EXISTS cde.datasets_lookup;
CREATE TABLE cde.datasets_lookup (
    pk serial PRIMARY KEY,
    dataset_id TEXT,
    erddap_url TEXT,
    UNIQUE(dataset_id, erddap_url)
);