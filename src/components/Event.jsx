import React, { useEffect, useRef, useState } from "react";
import {
	MDBCard,
	MDBCardBody,
	MDBCardHeader,
	MDBCardFooter,
	MDBBadge,
	MDBDropdown,
	MDBDropdownToggle,
	MDBDropdownMenu,
	MDBDropdownItem,
	MDBIcon,
	MDBCol,
	MDBRow,
	MDBBtn,
	MDBModal,
	MDBModalDialog,
	MDBModalContent,
	MDBModalHeader,
	MDBModalTitle,
	MDBModalBody,
	MDBModalFooter,
} from "mdb-react-ui-kit";
import axios from "axios";
import classNames from "classnames";
import { MDBAccordion, MDBAccordionItem } from "mdb-react-ui-kit";

// import * as mdb from "mdb-ui-kit";
// @import '~mdb-ui-kit/css/mdb.min.css';

import "./event.css";
import WeatherWidget from "./WheaterWidget";
import RouteWidget from "./RouteWidget";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCrown,
	faMountain,
	faRoad,
	faThumbsUp,
	faThumbsDown,
	faShirt,
} from "@fortawesome/free-solid-svg-icons";

export default function Event(props) {
	let event_data = props.data.event_data;
	// console.log(event_data);
	// let event_date = new Date(props.data.event_date).toLocaleDateString("de-DE", {
	//   year: "numeric",
	//   month: "2-digit",
	//   day: "2-digit",
	// });

	const [date, setDate] = useState(event_data.event_date);
	const [eventId, setEventId] = useState(props.data.id);
	const [startTime, setStartTime] = useState(event_data.event_startTime);
	const [comment, setComment] = useState(event_data.event_comment);
	const [link, setLink] = useState(event_data.event_link);
	const [members, setMembers] = useState(event_data.event_members);
	const [noMembers, setNoMembers] = useState(event_data.event_no_members);
	const [leader, setLeader] = useState(event_data.event_leader);
	const [jersey, setJersey] = useState(event_data.event_jersey);
	const [eventType, setEventType] = useState(event_data.event_type);
	const [editMode, setEditMode] = useState(false);
	const [currentEvent, setCurrentEvent] = useState(props.data);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
	const [saveConfirmationModal, setSaveConfirmationModal] = useState(false);

	const isMounted = useRef(false);

	const default_users = props.default_users;
	const default_types = props.default_types;
	const default_jerseys = props.default_jerseys;
	// console.log(eventType);

	// function handleDelete() {
	//   setIsDeleting(true);

	//   props.handleDelete(date).finally(() => {
	//     setIsDeleting(false);
	//   });
	// }

	const handleAbortDeleteEvent = () => {
		setDeleteConfirmationModal(false);
	};
	const handleAbortSaveEvent = () => {
		setSaveConfirmationModal(false);
	};

	const convertDate = (input_date) => {
		// const { value } = e.target;

		let newDate = Date.parse(input_date);
		let date = new Date(newDate).toLocaleDateString("de-DE", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});

		let day_name = new Date(newDate).toLocaleDateString("de-DE", {
			weekday: "long",
		});
		// console.log(day_name);
		return [day_name, date];
	};

	function handleDelete() {
		setIsDeleting(true);

		// console.log(props.data.event);
		axios
			.delete(`https://ptom.de/api/rad/events`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: JSON.stringify({ id: eventId }),
			})
			.then(() => {
				props.onDeleteEvent(eventId);
			})
			.catch((error) => {
				console.error(error);
			})
			.finally(() => {
				setIsDeleting(false);
			});
	}

	const createSelectLeader = () => {
		let dropdowns = [];
		default_users.forEach((user) => {
			dropdowns.push(
				<MDBDropdownItem
					key={user}
					data={user}
					onClick={(e) => {
						e.preventDefault();
						handleSelectLeader(e);
					}}
					link
				>
					{user}
				</MDBDropdownItem>
			);
		});

		return dropdowns;
	};

	const createSelectType = () => {
		let dropdowns = [];
		for (const [key, value] of Object.entries(default_types)) {
			// default_types.map((key, val) => {
			// console.log(val);
			dropdowns.push(
				<MDBDropdownItem
					key={key}
					value={key}
					onClick={(e) => {
						e.preventDefault();
						handleSelectType(e);
					}}
					link
				>
					{default_types[key].alias}
				</MDBDropdownItem>
			);
		}

		return dropdowns;
	};

	const handleSelectAdd = (e) => {
		// console.log(e.target.getAttribute("data"));
		let name = e.target.getAttribute("data");
		setMembers((members) => [...members, name]);
		setNoMembers(noMembers.filter((user) => user !== name));
	};

	const handleSelectDelete = (e) => {
		// console.log(e.target);
		let name = e.target.getAttribute("data");
		if (noMembers?.length == 0) {
			setNoMembers([name]);
		} else {
			setNoMembers((prevNoMembers) => [...prevNoMembers, name]);
		}

		setMembers((prevMembers) => prevMembers.filter((user) => user !== name));
	};

	const handleSelectLeader = (e) => {
		let name = e.target.firstChild.data;
		setLeader(name);
		// console.log(currentEvent);
	};

	const handleSelectJersey = (e) => {
		let jersey = e.target.firstChild.data;

		setJersey(jersey);
	};

	const handleSetComment = (e) => {
		// let name = e.target.value;
		let comment = e.target.value;
		setComment(comment);
		// console.log(currentEvent);
	};

	const handleSetLink = (e) => {
		let link = e.target.value;
		setLink(link);
		// console.log(currentEvent);
	};

	const handleSelectType = (e) => {
		let type = e.target.parentElement.getAttribute("value");
		// console.log(e.target.parentElement.getAttribute("value"));
		setEventType(type);
		// console.log(eventType);
	};

	const handleEdit = (e) => {
		setEditMode(true);
		// let name = e.target.firstChild.data;
	};
	const handleSave = () => {
		console.log("save");
		// let name = e.target.firstChild.data;
		setCurrentEvent({
			id: eventId,
			event_data: {
				event_date: date,
				event_startTime: startTime,
				event_members: members,
				event_no_members: noMembers,
				event_leader: leader,
				event_jersey: jersey,
				event_type: eventType,
				event_comment: comment,
				event_link: link,
			},
		});
	};

	useEffect(() => {
		if (isMounted.current) {
			toggleSaveConfirmationModal();
			updateEvent();
			setEditMode(false);
		} else {
			isMounted.current = true;
		}
	}, [currentEvent]);

	const handleAbort = (e) => {
		setEditMode(false);
	};

	const updateEvent = () => {
		// console.log(currentEvent);
		const requestOptions = {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(currentEvent),
		};
		fetch("https://ptom.de/api/rad/events", requestOptions);
	};

	// const deleteEvent = () => {
	//   const requestOptions = {
	//     method: "DELETE",
	//     headers: { "Content-Type": "application/json" },
	//     body: JSON.stringify({ event_date: currentEvent.event_date }),
	//   };
	//   fetch("https://ptom.de/api/rad/events", requestOptions);
	// };

	const createLeader = () => {
		if (editMode) {
			return (
				<MDBDropdown>
					<MDBDropdownToggle
						className="bg-orange"
						disabled={!editMode}
						hidden={!editMode}
					>
						{leader ? leader : "Organisator"}
					</MDBDropdownToggle>
					<MDBDropdownMenu>{createSelectLeader()}</MDBDropdownMenu>
				</MDBDropdown>
			);
		} else {
			return (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<FontAwesomeIcon icon={faCrown} />
					{leader ? leader : "offen"}
				</div>
			);
		}
	};

	const setTime = (e) => {
		const { value } = e.target;
		setStartTime(value);
	};
	const setEventDate = (e) => {
		const { value } = e.target;
		setDate(value);
	};

	const createStartTime = () => {
		if (editMode) {
			return (
				<input
					style={{ maxWidth: "150px" }}
					type="time"
					value={startTime}
					onChange={setTime}
					className="mb-2"
				></input>
			);
		} else {
			if (startTime) {
				return startTime;
			} else {
				return "Uhrzeit noch offen";
			}
		}
	};

	const createEventDate = () => {
		if (editMode) {
			return (
				<input
					style={{ maxWidth: "150px" }}
					type="date"
					value={date}
					onChange={setEventDate}
					className="mb-2"
				></input>
			);
		} else {
			if (date) {
				return (
					<>
						<h5>{convertDate(date)[0]}</h5> <h2>{convertDate(date)[1]}</h2>
					</>
				);
			} else {
				return <h2>Datum noch offen</h2>;
			}
		}
	};

	const getDataToType = (name) => {
		let data = {};
		for (const [key, value] of Object.entries(default_types)) {
			// default_types.map((key, value) => {
			if (key == name) {
				// console.log(t);
				data = key;
			}
		}

		return data;
	};
	const toggleDeleteConfirmationModal = () => {
		setDeleteConfirmationModal(!deleteConfirmationModal);
	};

	const toggleSaveConfirmationModal = () => {
		setSaveConfirmationModal(!saveConfirmationModal);
	};

	const createType = () => {
		if (editMode) {
			return (
				<MDBDropdown className="mb-2">
					<MDBDropdownToggle
						value={default_types[eventType].name}
						className="bg-orange"
						disabled={!editMode}
						hidden={!editMode}
					>
						{/* test */}
						{eventType ? eventType : "Typ setzen"}
					</MDBDropdownToggle>
					<MDBDropdownMenu>{createSelectType()}</MDBDropdownMenu>
				</MDBDropdown>
			);
		} else {
			// return <div>{getDataToType(eventType).alias}</div>;
			// console.log(default_types);
			return (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<FontAwesomeIcon icon={default_types[eventType].icon} />
					{default_types[eventType].alias
						? default_types[eventType].alias
						: "offen"}
				</div>
			);
		}
	};

	const createSelectJersey = () => {
		let dropdowns = [];
		default_jerseys.forEach((jersey) => {
			dropdowns.push(
				<MDBDropdownItem
					key={jersey}
					data={jersey}
					onClick={(e) => {
						e.preventDefault();
						handleSelectJersey(e);
					}}
					link
				>
					{jersey}
				</MDBDropdownItem>
			);
		});
		return dropdowns;
	};

	const createJersey = () => {
		if (editMode) {
			return (
				<MDBDropdown>
					<MDBDropdownToggle
						value={default_jerseys}
						className="bg-orange"
						disabled={!editMode}
						hidden={!editMode}
					>
						{/* test */}
						{jersey ? jersey : "Trikot auswählen"}
					</MDBDropdownToggle>
					<MDBDropdownMenu>{createSelectJersey()}</MDBDropdownMenu>
				</MDBDropdown>
			);
		} else {
			// return <div>{getDataToType(eventType).alias}</div>;
			// console.log(default_types);
			return (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<FontAwesomeIcon icon={faShirt} />
					{jersey ? jersey : "offen"}
				</div>
			);
		}
	};

	const createDeleteConfirmationModal = () => {
		return (
			<MDBModal
				show={deleteConfirmationModal}
				setShow={setDeleteConfirmationModal}
				tabIndex="-1"
			>
				<MDBModalDialog centered>
					<MDBModalContent>
						<MDBModalHeader>
							<MDBModalTitle>
								Termin am {convertDate(date)[0]}, den {convertDate(date)[1]}{" "}
								wirklich löschen?
							</MDBModalTitle>
							<MDBBtn
								className="btn-close"
								color="none"
								onClick={toggleDeleteConfirmationModal}
							></MDBBtn>
						</MDBModalHeader>
						{/* <MDBModalBody className="d-flex justify-content-center">
              
            </MDBModalBody> */}

						<MDBModalFooter>
							<MDBBtn color="secondary" onClick={handleAbortDeleteEvent}>
								Abbrechen
							</MDBBtn>
							<MDBBtn onClick={handleDelete}>Löschen</MDBBtn>
						</MDBModalFooter>
					</MDBModalContent>
				</MDBModalDialog>
			</MDBModal>
		);
	};

	const createCommentSection = () => {
		if (editMode) {
			return (
				<div className="md-form">
					<label htmlFor="form7">Kommentar</label>
					<textarea
						id="form7"
						className="md-textarea form-control"
						rows="2"
						onChange={handleSetComment}
						value={comment}
					></textarea>
				</div>
			);
		} else {
			return <p>{comment}</p>;
		}
	};
	const createLinkSection = () => {
		if (editMode) {
			return (
				<div className="md-form">
					<label htmlFor="form7">Strava oder Komoot Link</label>
					<textarea
						id="form7"
						className="md-textarea form-control"
						rows="2"
						onChange={handleSetLink}
						value={link}
					></textarea>
				</div>
			);
		} else if (link) {
			return <RouteWidget link={link}></RouteWidget>;
		}
	};

	const createSaveConfirmationModal = () => {
		return (
			<MDBModal
				show={saveConfirmationModal}
				setShow={setSaveConfirmationModal}
				tabIndex="-1"
			>
				<MDBModalDialog centered>
					<MDBModalContent>
						<MDBModalHeader>
							<MDBModalTitle>Änderungen speichern?</MDBModalTitle>
							<MDBBtn
								className="btn-close"
								color="none"
								onClick={toggleSaveConfirmationModal}
							></MDBBtn>
						</MDBModalHeader>
						{/* <MDBModalBody className="d-flex justify-content-center">
              
            </MDBModalBody> */}

						<MDBModalFooter>
							<MDBBtn color="secondary" onClick={handleAbortSaveEvent}>
								Abbrechen
							</MDBBtn>
							<MDBBtn onClick={handleSave}>Speichern</MDBBtn>
						</MDBModalFooter>
					</MDBModalContent>
				</MDBModalDialog>
			</MDBModal>
		);
	};

	const createParticipants = () => {
		const userList = default_users.map((user, index) => {
			let isInMembersList = members.includes(user);
			let isInNoMembersList = false;
			if (noMembers) {
				isInNoMembersList = noMembers.includes(user);
			}

			let btnClassName = `btn no-background}`;
			const btnSuccessClassName = `btn btn-${isInMembersList ? "success" : ""}`;
			const btnDangerClassName = `btn btn-${isInNoMembersList ? "danger" : ""}`;
			// console.log(btnSuccessClassName);
			return (
				<tr key={index}>
					<td>
						<MDBBtn
							type="button"
							className={btnSuccessClassName}
							onClick={handleSelectAdd}
							disabled={isInMembersList}
							hidden={!editMode}
							color={isInMembersList ? "success" : "white"}
							tag="a"
							floating
							id={`add_btn_${index}`}
						>
							<MDBIcon fas icon={"thumbs-up"} data={user} />
						</MDBBtn>
					</td>
					<td>{user}</td>
					<td>
						<MDBBtn
							type="button"
							className={btnDangerClassName}
							onClick={handleSelectDelete}
							disabled={isInNoMembersList}
							hidden={!editMode}
							color={isInNoMembersList ? "danger" : "white"}
							tag="a"
							floating
							id={`delete_btn_${index}`}
						>
							<MDBIcon fas icon={"thumbs-down"} data={user} />
						</MDBBtn>
					</td>
				</tr>
			);
		});

		return (
			<MDBAccordion initialActive={0} style={{ marginBottom: "20px" }}>
				<MDBAccordionItem
					collapseId={"collapse_list"}
					headerTitle={
						<>
							<MDBIcon fas icon="person" /> &nbsp; Teilnehmer
						</>
					}
				>
					<table className="usertable">
						<tbody>{userList}</tbody>
					</table>
				</MDBAccordionItem>
			</MDBAccordion>
		);
	};

	const createPill = (member) => {
		let isInMembersList = members.includes(member);
		let isInNoMembersList = false;
		if (noMembers) {
			isInNoMembersList = noMembers.includes(member);
		}

		return (
			<MDBBadge
				key={eventId + "_" + member}
				className="me-3"
				pill
				light
				color={
					isInMembersList ? "success" : isInNoMembersList ? "danger" : null
				}
			>
				{member}
			</MDBBadge>
		);
	};

	return (
		<>
			<MDBRow>
				<MDBCard alignment="center">
					<MDBCardHeader>
						<MDBBtn
							style={{ display: "block", position: "absolute", right: "10px" }}
							color="warning"
							tag="a"
							floating
							onClick={handleEdit}
							disabled={editMode}
							// hidden={editMode}
						>
							<MDBIcon fas icon="magic" />
						</MDBBtn>
						<MDBRow className="flex-mobile-wrap">
							<MDBCol center>{createType()}</MDBCol>
							<MDBCol center>
								<MDBRow center>{createEventDate()}</MDBRow>
								<MDBRow center>{createStartTime()}</MDBRow>
							</MDBCol>
							<MDBCol center>
								<MDBRow
									center
									className="d-flex justify-content-around align-items-center"
								>
									<MDBCol
										size="auto"
										className="d-flex justify-content-around align-items-center w-100"
									>
										{createLeader()}
										{createJersey()}
									</MDBCol>
								</MDBRow>
							</MDBCol>
						</MDBRow>
					</MDBCardHeader>
					<MDBCardBody
						className={classNames({
							"d-none":
								members.length < 1 &&
								noMembers?.length < 1 &&
								!comment &&
								!link &&
								!editMode,
						})}
					>
						<MDBRow className="flex-mobile-wrap" between>
							{/* <MDBCol className={classNames(!editMode && "d-none")} center>
                <MDBDropdown className="mb-3">
                  <MDBDropdownToggle
                    className="bg-danger"
                    disabled={members.length < 1}
                    hidden={!editMode}
                  >
                    Person entfernen
                  </MDBDropdownToggle>
                  <MDBDropdownMenu>{createDropdownDelete()}</MDBDropdownMenu>
                </MDBDropdown>
              </MDBCol> */}

							<MDBCol className="mb-3">
								{members && members.map((member) => createPill(member))}
							</MDBCol>
							{noMembers && noMembers.length > 0 && (
								<MDBCol className="mb-3">
									{noMembers.map((member) => createPill(member))}
								</MDBCol>
							)}
						</MDBRow>
						<MDBRow>
							<MDBCol className={classNames(!editMode && "d-none")} center>
								{createParticipants()}
							</MDBCol>
						</MDBRow>

						<MDBRow>
							<MDBCol className="comment-section">
								{createCommentSection()}
							</MDBCol>
						</MDBRow>
						<MDBRow>
							<MDBCol className="link-section">{createLinkSection()}</MDBCol>
						</MDBRow>
					</MDBCardBody>
					{/* <MDBCardFooter> */}
					<MDBCardFooter className={classNames(!editMode && "d-none")}>
						{/* <MDBRow md="3">
              <MDBCol md="3"></MDBCol>

              <MDBCol md="3"></MDBCol>
            </MDBRow> */}

						<MDBRow md="2" center>
							<MDBCol className={classNames(editMode && "d-none")}>
								{/* <WeatherWidget searchDate={date} searchTime={startTime} /> */}
							</MDBCol>

							<MDBCol className={classNames(!editMode && "d-none")}>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
									}}
								>
									<MDBBtn
										type="button"
										className="btn btn-danger"
										onClick={handleAbort}
										disabled={!editMode}
										hidden={!editMode}
										color="danger"
										tag="a"
										id="abort_btn"
										floating
									>
										<MDBIcon fas icon="xmark" />
									</MDBBtn>
									<label htmlFor="abort_btn">Abbrechen</label>
								</div>
							</MDBCol>
							<MDBCol className={classNames(!editMode && "d-none")}>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
									}}
								>
									<MDBBtn
										type="button"
										className="btn btn-success"
										onClick={toggleSaveConfirmationModal}
										disabled={!editMode}
										hidden={!editMode}
										color="success"
										tag="a"
										floating
										id="save_btn"
									>
										<MDBIcon fas icon="save" />
									</MDBBtn>
									<label htmlFor="save_btn">Speichern</label>
								</div>
							</MDBCol>
							<MDBCol className={classNames(!editMode && "d-none")}>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
									}}
								>
									<MDBBtn
										type="button"
										className="btn btn-danger"
										onClick={toggleDeleteConfirmationModal}
										disabled={!editMode}
										hidden={!editMode}
										color="danger"
										tag="a"
										floating
										id="delete_btn"
									>
										<MDBIcon fas icon="trash" />
									</MDBBtn>
									<label htmlFor="delete_btn">Löschen</label>
								</div>
							</MDBCol>

							{/* <MDBCol className={classNames(editMode && "d-none")}>
                <MDBBtn
                  color="warning"
                  tag="a"
                  floating
                  onClick={handleEdit}
                  disabled={editMode}
                  // hidden={editMode}
                >
                  <MDBIcon fas icon="magic" />
                </MDBBtn>
              </MDBCol> */}
						</MDBRow>
					</MDBCardFooter>
				</MDBCard>
			</MDBRow>
			{createDeleteConfirmationModal()}
			{createSaveConfirmationModal()}
		</>
	);
}
