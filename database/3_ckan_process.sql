/* 

    ckan_process()
    
    - updates datasets with data from CKAN
    - rewrites the organization table

*/

CREATE OR REPLACE FUNCTION ckan_process() RETURNS VOID AS $$
BEGIN


insert into cde.organizations (name)
select distinct unnest(organizations) from cde.datasets ON CONFLICT DO NOTHING;

UPDATE cde.organizations
SET pk_url=organizations_lookup.pk
FROM cde.organizations_lookup
WHERE organizations_lookup.name=organizations.name;

-- convert organization list of names into list of pks
with orgs as(
select d.pk,(
select array_remove(array_agg((select case when name=any(organizations) then pk_url end)),null) from cde.organizations) as asdf from cde.datasets d)
update cde.datasets set organization_pks=orgs.asdf
from orgs
where orgs.pk=datasets.pk;


  END;
$$ LANGUAGE plpgsql;
