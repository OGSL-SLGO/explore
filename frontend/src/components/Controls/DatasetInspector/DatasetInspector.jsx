import React, { useState, useEffect } from 'react'
import { ChevronCompactLeft } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import DataTable from 'react-data-table-component'
import DataTableExtensions from 'react-data-table-component-extensions'
import 'react-data-table-component-extensions/dist/index.css'

// import platformColors from '../../platformColors'
import Loading from '../Loading/Loading.jsx'
import { server } from '../../../config'
import { splitLines } from '../../../utilities'
import FilterButton from '../Filter/FilterButton/FilterButton.jsx'
import './styles.css'

export default function DatasetInspector({
  dataset,
  setInspectDataset,
  setBackClicked,
  setHoveredDataset,
  setInspectRecordID,
  filterSet,
  query
}) {
  const { t } = useTranslation()
  const [datasetRecords, setDatasetRecords] = useState()
  const [loading, setLoading] = useState(false)
  // const platformColor = platformColors.filter(
  //   (pc) => pc.platform === dataset.platform
  // )

  useEffect(() => {
    setLoading(true)
    const queryParams = new URLSearchParams(query)
    queryParams.set('datasetPKs', dataset.pk)

    fetch(`${server}/datasetRecordsList?${queryParams.toString()}`)
      .then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            setDatasetRecords(data)
            setLoading(false)
          })
        }
      })
      .catch((error) => {
        setLoading(false)
        throw error
      })
  }, [dataset])

  const dataColumnWith = '105px'

  const columns = [
    {
      name: splitLines(t('datasetInspectorRecordIDText')),
      selector: (row) => row.profile_id,
      sortable: true,
      wrap: true,
      width: '130px'
    },
    {
      name: splitLines(t('timeSelectorStartDate')),
      selector: (row) => row.time_min,
      sortable: true,
      wrap: true,
      width: dataColumnWith
    },
    {
      name: splitLines(t('timeSelectorEndDate')),
      selector: (row) => row.time_max,
      sortable: true,
      wrap: true,
      width: dataColumnWith
    },
    {
      name: splitLines(t('depthFilterStartDepth')),
      selector: (row) => row.depth_min,
      sortable: true,
      wrap: true,
      width: dataColumnWith
    },
    {
      name: splitLines(t('depthFilterEndDepth')),
      selector: (row) => row.depth_max,
      sortable: true,
      wrap: true,
      width: dataColumnWith
    }
  ]
  const data = datasetRecords?.profiles

  const tableData = {
    columns,
    data
  }

  const { eovFilter, platformFilter, orgFilter, datasetFilter } = filterSet

  return (
    <div className='datasetInspector'>
      <div
        className='backButton'
        onClick={() => {
          setBackClicked(true)
          setInspectDataset()
        }}
        title={t('datasetInspectorBackButtonTitle')} // 'Return to dataset list'
      >
        <ChevronCompactLeft />
        {t('datasetInspectorBackButtonText')}
        {/* Back */}
      </div>
      <div>
        <div
          className='metadataAndRecordIDTableGridContainer'
          onMouseEnter={() => setHoveredDataset(dataset)}
          onMouseLeave={() => setHoveredDataset()}
        >
          <strong>{t('datasetInspectorTitleText')}</strong>
          <FilterButton
            setOptionsSelected={datasetFilter.setDatasetsSelected}
            optionsSelected={datasetFilter.datasetsSelected}
            option={dataset}
          />
          <div className='metadataGridContainer'>
            <div className='metadataGridItem organisation'>
              <strong>{t('datasetInspectorOrganizationText')}</strong>
              {dataset.organizations.map((org, index) => {
                return (
                  <FilterButton
                    key={index}
                    setOptionsSelected={orgFilter.setOrgsSelected}
                    optionsSelected={orgFilter.orgsSelected}
                    option={
                      orgFilter.orgsSelected.filter((o) => org === o.title)[0]
                    }
                  />
                )
              })}
            </div>
            <div className='metadataGridItem variable'>
              <strong>{t('datasetInspectorOceanVariablesText')}</strong>
              {dataset.eovs.map((eov, index) => {
                return (
                  <FilterButton
                    key={index}
                    setOptionsSelected={eovFilter.setEovsSelected}
                    optionsSelected={eovFilter.eovsSelected}
                    option={
                      eovFilter.eovsSelected.filter((e) => eov === e.title)[0]
                    }
                  />
                )
              })}
            </div>
            <div className='metadataGridItem platform'>
              <strong>{t('datasetInspectorPlatformText')}</strong>
              <FilterButton
                setOptionsSelected={platformFilter.setPlatformsSelected}
                optionsSelected={platformFilter.platformsSelected}
                option={
                  platformFilter.platformsSelected.filter(
                    (p) => dataset.platform === p.title
                  )[0]
                }
              />
            </div>
            <div className='metadataGridItem records'>
              <strong>{t('datasetInspectorRecordsText')}</strong>
              {dataset.profiles_count !== dataset.n_profiles
                ? `${dataset.profiles_count} / ${dataset.n_profiles}`
                : dataset.profiles_count}
            </div>
            <div className='metadataGridItem ERDAP'>
              <strong>{t('datasetInspectorERDDAPText')}</strong>
              {dataset.erddap_url && (
                <a
                  className={dataset.erddap_url ? undefined : 'unavailable'}
                  href={dataset.erddap_url}
                  target='_blank'
                  title={
                    dataset.erddap_url ? dataset.erddap_url : 'unavailable'
                  }
                  rel='noreferrer'
                >
                  {t('datasetInspectorERDDAPURL')} (ERDDAP™)
                </a>
              )}
            </div>
            <div className='metadataGridItem CKAN'>
              <strong>{t('datasetInspectorCKANText')}</strong>
              {dataset.ckan_url && (
                <a
                  className={dataset.ckan_url ? undefined : 'unavailable'}
                  href={dataset.ckan_url}
                  target='_blank'
                  title={dataset.ckan_url ? dataset.ckan_url : 'unavailable'}
                  rel='noreferrer'
                >
                  {t('datasetInspectorCKANURL')} (CKAN)
                </a>
              )}
            </div>
          </div>
          <div className='metadataGridItem recordTable'>
            <strong>{t('datasetInspectorRecordTable')}</strong>
          </div>
          {loading ? (
            <div className='datasetInspectorLoadingContainer'>
              <Loading />
            </div>
          ) : (
            <div className='main'>
              <div>{t('datasetInspectorClickPreviewText')}</div>
              <DataTableExtensions
                {...tableData}
                print={false}
                filterPlaceholder={t('datasetInspectorFilterText')}
                export={false}
              >
                <DataTable
                  onRowClicked={(row) => setInspectRecordID(row.profile_id)}
                  striped
                  pointerOnHover
                  columns={columns}
                  data={data}
                  defaultSortField='profile_id'
                  defaultSortAsc={false}
                  pagination
                  paginationPerPage={100}
                  paginationRowsPerPageOptions={[100, 150, 200, 250]}
                  paginationComponentOptions={{
                    rowsPerPageText: t('tableComponentRowsPerPage'),
                    rangeSeparatorText: t('tableComponentOf'),
                    selectAllRowsItem: false
                  }}
                  highlightOnHover
                />
              </DataTableExtensions>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
