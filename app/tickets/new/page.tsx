import React from 'react'
import {NewTicketForm} from './ticket-form'

type Props = {}

const NewTicketPage = (props: Props) => {
	return (
		<div className='min-h-screen bg-blue-50 flex items-center justify-center px-4'>
      <NewTicketForm />
    </div>
	)
}

export default NewTicketPage