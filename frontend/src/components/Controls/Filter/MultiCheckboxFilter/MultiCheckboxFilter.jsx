import * as React from 'react'
import { CheckSquare, Square } from 'react-bootstrap-icons'
import { capitalizeFirstLetter, abbreviateString } from '../../../../utilities'

import './styles.css'

export default function MultiCheckboxFilter({ optionsSelected, setOptionsSelected, searchable, allOptions }) {
  return (
    <div className='multiCheckboxFilter'>
      {Object.keys(optionsSelected).length > 0 ? Object.keys(optionsSelected).map(option => (
        <div className='optionButton' key={option} title={option}
          onClick={() => {
            if (searchable) {
              let tempData = { ...allOptions }
              // Go through each of the elements in the subset
              // Find the corresponding element in the total set and set its selection status
              console.log(tempData)
              tempData[option] = !optionsSelected[option]
              // Set the total set 
              console.log(tempData)
              setOptionsSelected(tempData)
            } else {
              setOptionsSelected({
                ...optionsSelected,
                [option]: !optionsSelected[option]
              })
            }
          }}
        >
          {optionsSelected[option] ? <CheckSquare /> : <Square />}
          <span className='optionName'>
            {capitalizeFirstLetter(abbreviateString(option, 30))}
          </span>
        </div>
      ))
        : (
          <div>No filter options</div>
        )
      }
    </div>
  )
}