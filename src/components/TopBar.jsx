import { MDBCol } from "mdb-react-ui-kit";
import React, { useState, useEffect } from "react";
import ControlButtons from "./ControlButtons";
import "./topbar.css";

const TopBar = (props) => {
  const [showBar, setShowBar] = useState(true);

  useEffect(() => {
    let prevScrollPos = window.pageYOffset;
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const visible = prevScrollPos > currentScrollPos;
      setShowBar(visible);
      prevScrollPos = currentScrollPos;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="top-bar"
      style={{
        position: "fixed",
        top: showBar ? "0" : "-100px",
        left: "0",
        width: "100%",
        height: "100px",
        backgroundColor: "#853838",
        transition: "top 0.5s ease-in-out",
        zIndex: "999",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <MDBCol>
        <div style={{ color: "white" }}>Terminplaner</div>
      </MDBCol>

      <MDBCol>
        <div>
          <ControlButtons
            // resetList={resetList}
            currentEvents={props.currentEvents}
            onAddEvent={props.onAddEvent}
            // defaultEventData={defaultEventData}
            defaultEvent={props.defaultEvent}
          ></ControlButtons>
        </div>
      </MDBCol>
    </div>
  );
};

export default TopBar;
