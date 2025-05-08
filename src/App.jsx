import React, { useCallback, useEffect, useState } from "react";
import {
	MDBCard,
	MDBCardBody,
	MDBCardTitle,
	MDBCardText,
	MDBCardHeader,
	MDBCardFooter,
	MDBBtn,
	MDBContainer,
	MDBBadge,
	MDBDropdown,
	MDBDropdownToggle,
	MDBDropdownMenu,
	MDBDropdownItem,
	MDBIcon,
	MDBCol,
	MDBRow,
} from "mdb-react-ui-kit";
import { add } from "date-fns";
import useSWR from "swr";
import Event from "./components/Event";
import ControlButtons from "./components/ControlButtons";
import axios from "axios";
import TopBar from "./components/TopBar";

import {
	faMountain,
	faRoad,
	faBaseball,
} from "@fortawesome/free-solid-svg-icons";

export default function App() {
	const [currentEvents, setCurrentEvents] = useState([]);
	// const [currentEvent, setCurrentEvent] = useState({});
	// const [editMode, setEditMode] = useState(false);
	const [dataChanged, setDataChanged] = useState();
	// const [newDataAvailable, setNewDataAvailable] = useState(false);

	// const [data, setData] = useState([]);

	const daysRange = 250;

	// Sunday = 0
	// Monday = 1
	// ....
	const allowedDays = [5];
	const default_startTime = "15:00";
	const defaultType = "rennrad";

	const defaultEventData = {
		event_startTime: default_startTime,
		event_members: [],
		event_no_members: [],
		event_leader: "",
		event_type: defaultType,
		event_comment: "",
		event_link: "",
	};

	// const dates = [1, 2, 3, 4, 5];
	const default_users = [
		"Pascal",
		"Flo",
		"Jan",
		"Max B.",
		"Jonas",
		"Samuel",
		"Tom",
		"Alex",
		"David",
		"Max H.",
		"Gil",
		"Tim",
	];
	default_users.sort();
	const default_types = {
		rennrad: { alias: "Rennrad", icon: faRoad },
		mtb: { alias: "MTB", icon: faMountain },
		squash: { alias: "Squash", icon: faBaseball },
	};

	const jerseys = [
		"McDonalds",
		"FDJ",
		"Deutschlandtour",
		"Cofidis",
		"HTC",
		"freie Auswahl",
	];
	// const default_types =[
	//   { name: "rennrad", alias: "Rennrad", icon: faRoad },
	//   { name: "mtb", alias: "MTB", icon: faMountain },
	//   { name: "squash", alias: "Squash", icon: faBaseball },
	// ];

	const defaultEvent = {
		id: null,
		event_data: {
			event_date: "",
			event_startTime: default_startTime,
			event_members: [],
			event_no_members: [],
			event_leader: "",
			event_jersey: "",
			event_type: defaultType,
			event_comment: "",
			event_link: "",
		},
	};

	// get Events
	// useEffect(() => {
	//   console.log("newDataAvailable: fetching data...");
	//   const requestOptions = {
	//     method: "GET",
	//     // headers: { "Content-Type": "application/json" },
	//   };
	//   fetch("https://ptom.de/api/rad/events", requestOptions)
	//     .then((response) => response.json())
	//     .then((data) => {
	//       console.log("data loaded:");
	//       setCurrentEvents(data);

	//       // console.log(currentEvents);

	//       // setDataLoaded(true);
	//     });
	// }, [dataChanged]);

	useEffect(() => {
		// console.log("currentEvents geändert: " + currentEvents);
		// console.log(currentEvents);
	}, [currentEvents]);

	// const createEvent = () => {
	//   let event = {
	//     date: loc_date,
	//     time: defaultevent_startTime,
	//     event_members: [],
	//     event_leader,
	//   };
	//   return event;
	// };

	useEffect(() => {
		// console.log("fetching data...");
		fetchData();
	}, []);

	const fetchData = async () => {
		const requestOptions = {
			method: "GET",
			// headers: { "Content-Type": "application/json" },
		};
		fetch("https://ptom.de/api/rad/events", requestOptions)
			.then((response) => response.json())
			.then((data) => {
				// console.log("data loaded:");
				setCurrentEvents(data);
				// console.log(data);
			});
	};

	// const resetList = useCallback(() => {
	//   setCurrentEvents((currentEvents) => currentEvents);
	//   setDataChanged();
	//   console.log("List resettet");
	// }, []);

	function createEventList() {
		for (let i = 0; i < daysRange; i++) {
			let single_date = add(new Date(), { days: i });
			if (allowedDays.includes(single_date.getDay())) {
				let loc_date = single_date.toLocaleDateString("us-US", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				});
				let loc_time = single_date.toLocaleTimeString("de-DE", {
					hour: "2-digit",
					minute: "2-digit",
				});
				// console.log(loc_time);
				// console.log(date.toLocaleDateString("de-DE"));
				// let obj = {
				//   date: loc_date,
				//   time: defaultevent_startTime,
				//   event_members: [],
				//   event_leader       };
				// console.log(loc_date);

				let new_event = defaultEvent;
				new_event.event_data.event_date = loc_date;
				// console.log(new_event);
				const requestOptions = {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						event_data: new_event.event_data,
					}),
				};
				fetch("https://ptom.de/api/rad/events", requestOptions)
					.then((response) => {
						response.json();
					})
					.then((data) => {
						// console.log(data);
						handleAddEvent(new_event);
					});
			}

			// console.log(loc_date);
		}
	}

	useEffect(() => {
		// createEventList();
	}, []);

	// const handleAddEvent = (event) => {
	//   // console.log(currentEvents);
	//   setCurrentEvents(
	//     [...currentEvents, event].sort(
	//       (a, b) => new Date(a.event_date) - new Date(b.event_date)
	//     )
	//   );
	// };
	// const handleAddEvent = (event) => {
	//   setCurrentEvents((prevEvents) => {
	//     const updatedEvents = [...prevEvents, event];
	//     updatedEvents.sort(
	//       (a, b) =>
	//         new Date(a.event_data.event_date) - new Date(b.event_data.event_date)
	//     );
	//     return updatedEvents;
	//   });
	// };

	const handleAddEvent = (event) => {
		console.log(event);
		let new_event = defaultEvent;
		new_event.event_data.event_date = event.event_data.event_date;
		const requestOptions = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				event_data: new_event.event_data,
			}),
		};

		fetch("https://ptom.de/api/rad/events", requestOptions)
			.then((response) => response.json())
			.then((data) => {
				console.log(data);
				setCurrentEvents((prevEvents) => {
					const updatedEvents = [...prevEvents, data[0]];
					updatedEvents.sort(
						(a, b) =>
							new Date(a.event_data.event_date) -
							new Date(b.event_data.event_date)
					);
					return updatedEvents;
				});
			})
			.catch((error) => {
				console.error("Fehler beim Hinzufügen des Events:", error);
			});
	};

	const handleDeleteEvent = (eventId) => {
		console.log("delete event:" + eventId);
		console.log("currenEvents:");
		console.log(currentEvents);
		console.log("filtering...");
		setCurrentEvents(currentEvents.filter((item) => item.id !== eventId));
		let temp = currentEvents.filter((item) => item.id !== eventId);
		console.log("filter in variable: ");
		console.log(temp);
		console.log("current Events after filter: ");
		console.log(currentEvents);
	};

	useEffect(() => {
		// setNewDataAvailable(true);
		// console.log(currentEvents);
	}, []);

	// function handleNewData(state) {
	//   setNewDataAvailable(state);
	// }

	const handleDelete = (id) => {
		// let name = e.target.firstChild.data;
		// setIsDeleting(true);
		// const requestOptions = {
		//   method: "DELETE",
		//   headers: { "Content-Type": "application/json" },
		//   body: JSON.stringify({ event_date: id }),
		// };
		// fetch("https://ptom.de/api/rad/events", requestOptions)
		//   .then((response) => {})
		//   .then((data) => {
		//     setCurrentEvents(
		//       currentEvents.filter((item) => item.event_date !== id)
		//     );
		//     // setIsDeleting(false);
		//     // setDataLoaded(true);
		//   });

		// props.handleNewData(true);
		// setEditMode(false);
		// console.log(id);
		axios
			.delete(`https://ptom.de/api/rad/events`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: JSON.stringify({ id: id }),
			})
			.then(() => {
				// console.log(currentEvents);
				// console.log(id);
				currentEvents.forEach((i) => {
					console.log("to delete: " + id);
					console.log(i.id);
					console.log("------");
				});
				let temp_data = currentEvents.filter((item) => item.id !== id);
				// console.log(temp_data);
				setCurrentEvents(temp_data);

				// console.log(currentEvents);
			})
			.catch((error) => {
				console.error(error);
			});
	};

	useEffect(() => {
		// console.log("curentevents");
	}, [currentEvents]);

	return (
		<>
			<MDBContainer>
				<TopBar
					currentEvents={currentEvents}
					onAddEvent={handleAddEvent}
					// defaultEventData={defaultEventData}
					defaultEvent={defaultEvent}
				></TopBar>

				<MDBContainer style={{ paddingTop: "95px" }} className="d-grid gap-3">
					{currentEvents.map((event) => (
						<Event
							key={event.id}
							default_users={default_users}
							default_jerseys={jerseys}
							default_types={default_types}
							onDeleteEvent={handleDeleteEvent}
							data={event}
						></Event>
					))}
				</MDBContainer>
			</MDBContainer>
		</>
	);
}
