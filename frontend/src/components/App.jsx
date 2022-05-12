import React from 'react'
import { useState, useEffect } from 'react'
import * as Sentry from "@sentry/react"
import { Integrations } from "@sentry/tracing"
import { Col, Spinner } from 'react-bootstrap'
import { ChatDots, CheckCircle, XCircle } from 'react-bootstrap-icons'
import { useTranslation } from 'react-i18next'
import _ from 'lodash'

import { server } from '../config.js'
import Controls from "./Controls/Controls.jsx"
import Map from "./Map/Map.js"
import SelectionPanel from './Controls/SelectionPanel/SelectionPanel.jsx'
import SelectionDetails from './Controls/SelectionDetails/SelectionDetails.jsx'
import DownloadDetails from './Controls/DownloadDetails/DownloadDetails.jsx'
import DataDownloadModal from './Controls/DataDownloadModal/DataDownloadModal.jsx'
import Loading from './Controls/Loading/Loading.jsx'
import LanguageSelector from './Controls/LanguageSelector/LanguageSelector.jsx'
import Legend from './Controls/Legend/Legend.jsx'
import IntroModal from './Controls/IntroModal/IntroModal.jsx'
import { defaultEovsSelected, defaultOrgsSelected, defaultStartDate, defaultEndDate, defaultStartDepth, defaultEndDepth, defaultDatatsetsSelected } from './config.js'
import { createDataFilterQueryString, validateEmail, getCurrentRangeLevel, getPointsDataSize, abbreviateString } from '../utilities.js'

import "bootstrap/dist/css/bootstrap.min.css"
import "./styles.css"

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://ccb1d8806b1c42cb83ef83040dc0d7c0@o56764.ingest.sentry.io/5863595",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [eovs, setEovs] = useState(defaultEovsSelected)
  const [orgs, setOrgs] = useState(defaultOrgsSelected)
  const [datasets, setDatasets] = useState(defaultDatatsetsSelected)
  const [selectionPanelOpen, setSelectionPanelOpen] = useState()
  const [pointsToDownload, setPointsToDownload] = useState()
  const [pointsToReview, setPointsToReview] = useState()
  const [polygon, setPolygon] = useState()
  const [email, setEmail] = useState()
  const [emailValid, setEmailValid] = useState(false)
  const [submissionState, setSubmissionState] = useState()
  const [submissionFeedback, setSubmissionFeedback] = useState()
  const [loading, setLoading] = useState(true)
  const [organizationPKs, setOrganizationPKs] = useState()
  const [datasetPKs, setDatasetPKs] = useState()
  const [zoom, setZoom] = useState(2)
  const [rangeLevels, setRangeLevels] = useState()
  const [currentRangeLevel, setCurrentRangeLevel] = useState()
  const [query, setQuery] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    startDepth: defaultStartDepth,
    endDepth: defaultEndDepth,
    eovsSelected: defaultEovsSelected,
    orgsSelected: defaultOrgsSelected,
    datasetsSelected: defaultDatatsetsSelected
  })

  useEffect(() => {
    if (_.isEmpty(pointsToDownload)) {
      setSubmissionFeedback()
    }
  }, [pointsToDownload])

  useEffect(() => {
    if (_.isEmpty(pointsToReview)) {
      setPointsToDownload()
    }
  }, [pointsToReview])

  // TODO: instead of running these retrivals for org and dataset pks, add as properties to the options lists.

  // Filter option data structure: 
  /*
  [{
    title: 'abc',
    isSelected: boolean,
    titleTranslated: {
      en: 'abc',
      fr: 'def'
    },
    pk: 123
  }]
  */
  useEffect(() => {
    /* /oceanVariables returns array of variable names: 
      ['abc', 'def', ...] 
    */
    fetch(`${server}/oceanVariables`).then(response => response.json()).then(eovs => {
      setEovs(eovs.map(eov => {
        return {
          title: eov,
          isSelected: false
        }
      }))
    }).catch(error => { throw error })

    /* /organizations returns array of org objects: 
      [
        {
          color:null, 
          name:'abc', 
          pk_text:null
          pk:87, 
        },
        ...
      ] 
    */
    fetch(`${server}/organizations`).then(response => response.json()).then(orgsR => {
      setOrgs(orgsR.map(org => {
        return {
          title: org.name,
          isSelected: false,
          pk: org.pk
        }
      }))
      setOrganizationPKs(orgsR.reduce((accumulationObject, org) => {
        accumulationObject[org.name] = org.pk
        return accumulationObject
      }, {}))
    }).catch(error => { throw error })

    /* /datasets returns array of dataset objects 
      [
        {
          title:'abc', 
          title_translated:
            {
              en: 'abc', 
              fr: 'def'
            }
          organization_pks: [54, ...], 
          pk: 86923, 
        }
      ]
    */
    fetch(`${server}/datasets`).then(response => response.json()).then(datasetsR => {
      setDatasets(datasetsR.map(dataset => {
        return {
          title: dataset.title,
          isSelected: false,
          pk: dataset.pk
        }
      }))
      setDatasetPKs(datasetsR.reduce((accumulationObject, dataset) => {
        accumulationObject[dataset.title.slice(0, 1)] = dataset.pk
        return accumulationObject
      }, {}))
    }).catch(error => { throw error })
  }, [])


  useEffect(() => {
    switch (submissionState) {
      case 'submitted':
        submitRequest()
        setSubmissionFeedback({
          icon: (
            <Spinner
              className='text-warning'
              as="span"
              animation="border"
              size={30}
              role="status"
              aria-hidden="true"
            />
          ),
          text: t('submissionStateTextSubmitting') //'Submitting...'
        })
        break;

      case 'successful':
        setSubmissionFeedback({
          icon: (
            <CheckCircle
              className='text-success'
              size={30}
            />),
          text: t('submissionStateTextSuccess', { email }) //Request successful. Download link will be sent to: ' + email
        })
        break;

      case 'failed':
        setSubmissionFeedback({
          icon: (
            <XCircle
              className='text-danger'
              size={30}
            />
          ),
          text: t('submissionStateTextFailed') //'Request failed'
        })
        break;

      default:
        setSubmissionFeedback()
        break;
    }
  }, [submissionState])

  useEffect(() => {
    fetch(`${server}/legend?${createDataFilterQueryString(query, organizationPKs, datasetPKs)}`).then(response => response.json()).then(legend => {
      if (legend) {
        setRangeLevels(legend.recordsCount)
      }
    })
  }, [query])

  useEffect(() => {
    if (rangeLevels) {
      setCurrentRangeLevel(getCurrentRangeLevel(rangeLevels, zoom))
    }
  }, [rangeLevels, zoom])

  useEffect(() => {
    setEmailValid(validateEmail(email))
    setSubmissionState()
  }, [email])

  function handleEmailChange(value) {
    setEmail(value)
  }

  function handleSubmission() {
    setSubmissionState('submitted')
  }

  function submitRequest() {
    fetch(`${server}/download?${createDataFilterQueryString(query, organizationPKs, datasetPKs)}&polygon=${JSON.stringify(polygon)}&datasetPKs=${pointsToDownload.map(point => point.pk).join(',')}&email=${email}&lang=${i18n.language}`).then((response) => {
      if (response.ok) {
        setSubmissionState('successful')
      } else {
        setSubmissionState('failed')
      }
    }).catch(error => {
      setSubmissionState('failed')
      throw error
    })
  }

  function DownloadButton() {
    return (
      <DataDownloadModal
        disabled={_.isEmpty(pointsToReview)}
        setEmail={setEmail}
        setSubmissionState={setSubmissionState}
      >
        <DownloadDetails
          width={650}
          pointsToReview={pointsToReview}
          setPointsToDownload={setPointsToDownload}
        >
          <Col>
            <input
              disabled={submissionState === 'submitted'}
              className='emailAddress'
              type='email'
              placeholder='email@email.com'
              onInput={e => handleEmailChange(e.target.value)}
            />
          </Col>
          <Col xs='auto'>
            <button
              className='submitRequestButton'
              disabled={!emailValid || _.isEmpty(pointsToDownload) || getPointsDataSize(pointsToDownload) / 1000000 > 100 || submissionState === 'submitted'}
              onClick={() => handleSubmission()}
            >
              {
                (!_.isEmpty(pointsToDownload) && submissionFeedback && submissionState !== 'submitted' && t('submitRequestButtonResubmitText')) ||
                (_.isEmpty(pointsToDownload) && t('submitRequestButtonSelectDataText')) ||
                t('submitRequestButtonSubmitText') //'Submit Request'
              }
            </button>
          </Col>
          <Col className='submissionFeedback'>
            {submissionFeedback && submissionFeedback.icon}
            {submissionFeedback && submissionFeedback.text}
          </Col>
        </DownloadDetails>
      </DataDownloadModal >
    )
  }

  return (
    <div>
      {loading && <Loading />}
      {rangeLevels &&
        <Map
          setPolygon={setPolygon}
          setPointsToReview={setPointsToReview}
          setLoading={setLoading}
          query={query}
          polygon={polygon}
          organizations={organizationPKs}
          datasets={datasetPKs}
          zoom={zoom}
          setZoom={setZoom}
          rangeLevels={rangeLevels}
          offsetFlyTo={selectionPanelOpen}
        />
      }
      <Controls
        eovs={eovs}
        orgs={orgs}
        datasets={datasets}
        setQuery={setQuery}
        loading={loading}
      >
        {polygon && (
          <Col xs='auto' className='selectionPanelColumn'>
            <SelectionPanel
              open={selectionPanelOpen}
              setOpen={setSelectionPanelOpen}
            >
              <SelectionDetails
                pointsToReview={pointsToReview}
                setPointsToReview={setPointsToReview}
                query={query}
                polygon={polygon}
                organizations={organizationPKs}
                datasets={datasetPKs}
              >
                {DownloadButton()}
              </SelectionDetails>
            </SelectionPanel>
          </Col>
        )}
        <div>
          {DownloadButton()}
        </div>
      </Controls>
      {i18n.language === 'en' ?
        <a
          title={t('CIOOSLogoButtonTitle')}
          className='logo english'
          href='https://cioos.ca/'
          target='_blank'
        /> :
        <a
          title={t('CIOOSLogoButtonTitle')}
          className='logo french'
          href='https://cioos.ca/'
          target='_blank'
        />
      }
      {currentRangeLevel && <Legend currentRangeLevel={currentRangeLevel} />}
      <button
        className='boxQueryButton'
        id='boxQueryButton'
        title={t('rectangleToolTitle')}
      >
        <div className='rectangleIcon' />
      </button>
      <a
        className='feedbackButton'
        title={t('feedbackButtonTitle')}
        href='https://docs.google.com/forms/d/1OAmp6_LDrCyb4KQZ3nANCljXw5YVLD4uzMsWyuh47KI/edit'
        target='_blank'
      >
        <ChatDots size='30px' />
      </a>
      <IntroModal initialOpenState={true} />
      <LanguageSelector />
    </div >
  );
}
