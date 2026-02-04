import React, { useEffect, useState } from "react";
import {
	MDBBtn,
	MDBIcon,
	MDBModal,
	MDBModalBody,
	MDBModalContent,
	MDBModalDialog,
	MDBModalFooter,
	MDBModalHeader,
	MDBModalTitle,
} from "mdb-react-ui-kit";
import "./controlbuttons.css";

export default function ControlButtons(props) {
	// console.log(props);
	//   const [editMode, setEditMode] = useState(false);
	//   const [addMode, setAddMode] = useState(false);
	const [addModal, setAddModal] = useState(false);
	const [editModal, setEditModal] = useState(false);
	const [newEventDate, setNewEventDate] = useState();
	const [dataSent, setDataSent] = useState(false);

	const handleEdit = () => {};

	const toggleAddModal = () => {
		setAddModal(!addModal);
	};

	const toggleEditModal = () => {
		setEditModal(!editModal);
	};

	const handleAbort = () => {
		setAddModal(false);
	};

	const handleEditAbort = () => {
		setEditModal(false);
	};

	const handleAddEvent = () => {
		// Create a deep copy to avoid mutating the defaultEvent
		let new_event = {
			id: props.defaultEvent.id,
			event_data: {
				...props.defaultEvent.event_data,
				event_date: newEventDate,
			},
		};
		// // console.log(new_event);
		// const requestOptions = {
		//   method: "POST",
		//   headers: { "Content-Type": "application/json" },
		//   body: JSON.stringify({
		//     event_data: new_event.event_data,
		//   }),
		// };
		// fetch("https://ptom.de/api/rad/events", requestOptions)
		//   .then((response) => {
		//     response.json();
		//   })
		//   .then((data) => {
		//     console.log(data);
		//     props.onAddEvent(new_event);
		//   });
		props.onAddEvent(new_event);
		// close Modal
		setAddModal(!addModal);
	};

	const setDate = (e) => {
		const { value } = e.target;
		setNewEventDate(value);
	};

	const handleResetList = () => {
		props.resetList();
	};

	// const createNewEvent = () => {
	//   // setDataSent(false);
	//   const requestOptions = {
	//     method: "POST",
	//     headers: { "Content-Type": "application/json" },
	//     body: JSON.stringify({
	//       event_date: newEventDate,
	//       default_data: props.defaultEventData,
	//     }),
	//   };
	//   fetch("https://ptom.de/api/rad/events", requestOptions)
	//     .then((response) => {
	//       // console.log(response);
	//     })
	//     .then((data) => {
	//       // console.log(data);
	//       // setDataSent(true);
	//       // handleResetList();
	//     });
	// };
	useEffect(() => {
		if (dataSent) {
			console.log("data sent");
			props.handleNewData(dataSent);
		}
		// console.log(dataSent);
	}, [dataSent]);

	useEffect(() => {
		const date = new Date();
		const options = { year: "numeric", month: "2-digit", day: "2-digit" };
		const locale = "de-DE";
		const formattedDate = date.toLocaleDateString(locale, options);
		setNewEventDate(formattedDate);
	}, []);

	const createAddModal = () => {
		return (
			<MDBModal show={addModal} setShow={setAddModal} tabIndex="-1">
				<MDBModalDialog style={{ zIndex: "10000" }} centered>
					<MDBModalContent>
						<MDBModalHeader>
							<MDBModalTitle>Neuen Termin hinzufügen</MDBModalTitle>
							<MDBBtn
								className="btn-close"
								color="none"
								onClick={toggleAddModal}
							></MDBBtn>
						</MDBModalHeader>
						<MDBModalBody className="d-flex justify-content-center">
							<input
								type="date"
								// value={newEventDate}
								onChange={setDate}
								placeholder="test"
							></input>
						</MDBModalBody>

						<MDBModalFooter>
							<MDBBtn color="secondary" onClick={handleAbort}>
								Abbrechen
							</MDBBtn>
							<MDBBtn onClick={handleAddEvent}>Speichern</MDBBtn>
						</MDBModalFooter>
					</MDBModalContent>
				</MDBModalDialog>
			</MDBModal>
		);
	};

	const createEditModal = () => {
		return (
			<MDBModal show={editModal} setShow={setEditModal} tabIndex="-1">
				<MDBModalDialog centered>
					<MDBModalContent>
						<MDBModalHeader>
							<MDBModalTitle>
								Dieser Button kann noch gar nichts...
							</MDBModalTitle>
							<MDBBtn
								className="btn-close"
								color="none"
								onClick={toggleEditModal}
							></MDBBtn>
						</MDBModalHeader>
						{/* <MDBModalBody className="d-flex justify-content-center">
              
              
            </MDBModalBody> */}

						<MDBModalFooter>
							<MDBBtn color="secondary" onClick={handleEditAbort}>
								Ok
							</MDBBtn>
							<MDBBtn onClick={handleEditAbort}>Ok</MDBBtn>
						</MDBModalFooter>
					</MDBModalContent>
				</MDBModalDialog>
			</MDBModal>
		);
	};

	return (
		<>
			<div className="cb-container">
				<MDBBtn
					className="single-button"
					type="button"
					color="warning"
					tag="a"
					floating
					onClick={toggleEditModal}
					// disabled={editMode}
					// hidden={editMode}
				>
					<MDBIcon fas icon="magic" />
				</MDBBtn>
				<MDBBtn
					className="single-button"
					type="button"
					color="success"
					tag="a"
					floating
					onClick={toggleAddModal}
					// disabled={editMode}
					// hidden={editMode}
				>
					<MDBIcon fas icon="plus" />
				</MDBBtn>
				{createAddModal()}
				{createEditModal()}
			</div>
		</>
	);
}
