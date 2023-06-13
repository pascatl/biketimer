import React, { useEffect, useState } from "react";
import komootLogo from "../assets/Komoot_Sign_Primary_RGB.svg";
import useSWR from "swr";
import "./komootwidget.css";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsLeftRight,
  faArrowUpRightDots,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";

const API_URL = "https://ptom.de/api/biketimer/komoot";

export default function KomootWidget(props) {
  const [komootLink, setKomootLink] = useState(props.link);
  const [komootData, setKomootData] = useState(null);
  //   const [processedKomootData, setProcessedKomootData] = useState(null);

  const processData = (data) => {
    let d = data.page._embedded.tour;
    // console.log(d);
    setKomootData(d);
  };

  const processLink = () => {
    const url = new URL(props.link);
    const path = url.pathname.split("/");
    const params = url.searchParams;
    // console.log(path);
    // console.log(params);
    let obj = {
      tour_id: path[path.length - 1],
      share_token: params.get("share_token"),
    };
    return obj;
  };

  const convertCoordinatesToChartData = (coordinates) => {
    const data = {
      labels: [],
      datasets: [
        {
          label: "Höhenprofil",
          data: [],
          fill: false,
          borderColor: "green",
          tension: 0.1,
          pointsStyle: false,
          pointRadius: 0,
        },
      ],
    };
    // console.log(coordinates);
    coordinates.forEach((coordinate) => {
      data.labels.push(coordinate.t);
      data.datasets[0].data.push(coordinate.alt);
    });

    return data;
  };

  const CoordinateChart = () => {
    // console.log(komootData._embedded.coordinates.items);
    let coords = komootData._embedded.coordinates.items;
    const chartData = convertCoordinatesToChartData(coords);

    const options = {
      options: {
        maintainAspectRatio: false,
        showTooltips: false,
      },

      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { display: false }, grid: { display: false } },
      },
    };

    return <Line options={options} data={chartData} />;
  };

  const { error } = useSWR(
    API_URL +
      `?tour_id=${processLink().tour_id}&share_token=${
        processLink().share_token
      }`,
    {
      fetcher: async (url) => {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Onlyprops: "true",
            //   "User-Agent": "PostmanRuntime/7.32.2",
          },
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        return response.json();
      },
      onSuccess: (fetchedData) => {
        //   console.log(fetchedData);
        processData(fetchedData);
        //   setKomootData(fetchedData);
      },
    }
  );

  if (error) {
    // Handle error state
    return <div>Error: {error.message}</div>;
  }

  if (!komootData) {
    // Loading state
    return <div>Loading...</div>;
  }

  return (
    <div className="komoot-card">
      <div className="header">
        {" "}
        <div className="tourtitle">{komootData.name}</div>
      </div>
      <div className="komoot-body">
        <div className="hoehenprofil">{CoordinateChart()}</div>
        <div className="tourprops">
          <div className="tourprop">
            <FontAwesomeIcon icon={faArrowsLeftRight} />
            {Math.round(komootData.distance / 1000)} km
          </div>
          {/* <div>{komootData.duration}</div> */}
          <div className="tourprop">
            <FontAwesomeIcon icon={faArrowUpRightDots} />
            {Math.round(komootData.elevation_up)} m
          </div>
          <div className="tourprop">
            <FontAwesomeIcon icon={faArrowTrendDown} />
            {Math.round(komootData.elevation_down)} m
          </div>
        </div>

        {/* <div>
        <img height={"250px"} src={komootData.map_image.src} alt="" />
      </div> */}

        <a href={komootLink} target="_blank">
          <img
            style={{ cursor: "pointer" }}
            height={"50px"}
            src={komootLogo}
          ></img>
        </a>
      </div>
    </div>
  );
}
