import React, { useEffect, useState } from "react";
import komootLogo from "../assets/Komoot_Sign_Primary_RGB.svg";
import stravaLogo from "../assets/strava.png";
import useSWR from "swr";
import "./routewidget.css";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { MDBSpinner } from "mdb-react-ui-kit";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsLeftRight,
  faArrowUpRightDots,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const API_URL_KOMOOT = "https://ptom.de/api/biketimer/komoot";
const API_URL_STRAVA = "https://ptom.de/api/biketimer/strava";

export default function RouteWidget(props) {
  const [routeLink, setRouteLink] = useState(props.link);
  const [routeData, setRouteData] = useState(null);
  const [routeConfig, setRouteConfig] = useState(null);
  //   const [processedrouteData, setProcessedrouteData] = useState(null);

  const processKomootData = (data) => {
    let d = data.page._embedded.tour;
    d.coordinates = data.page._embedded.tour._embedded.coordinates.items;
    // console.log(d);
    setRouteData(d);
  };

  const processStravaData = (data) => {
    console.log(data.map.polyline);
    let d = {
      name: data.name,
      distance: data.distance,
      elevation_up: data.elevation_gain,
      elevation_down: null,
      // coordinates: [null],
      map_img: data.map_urls.url,
    };
    setRouteData(d);
    // setRouteData(data);
  };

  const validateLink = () => {
    const url = new URL(props.link);
    const path = url.pathname.split("/");
    const host = url.hostname.split(".")[url.hostname.split(".").length - 2];
    const params = url.searchParams;
    let obj;
    let null_obj = { service: null };

    const valid_hosts = ["komoot", "strava"];
    if (valid_hosts.includes(host)) {
      switch (host) {
        case "komoot":
          if (
            typeof parseInt(path[path.length - 1]) === "number" &&
            params.get("share_token")
          ) {
            obj = {
              service: host,
              tour_id: path[path.length - 1],
              share_token: params.get("share_token"),
            };
            setRouteConfig(obj);
          } else {
            setRouteConfig(null_obj);
          }
          break;
        case "strava":
          if (
            typeof parseInt(path[path.length - 1]) === "number" &&
            path[path.length - 2] == "routes"
          ) {
            obj = {
              service: host,
              route_id: path[path.length - 1],
            };

            setRouteConfig(obj);
          } else {
            setRouteConfig(null_obj);
          }
          break;
        default:
          setRouteConfig(null_obj);
          break;
      }
    } else {
      setRouteConfig(null_obj);
      // kein valid host
    }
  };

  // const validateHost = (host) => {
  //   switch (host) {
  //     case "komoot":
  //       break;
  //     case "strava":
  //       break;
  //     default:
  //       break;
  //   }
  // };

  const fetchKomoot = async () => {
    try {
      const url =
        API_URL_KOMOOT +
        `?tour_id=${routeConfig.tour_id}&share_token=${routeConfig.share_token}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) {
        throw new Error("API request failed");
      }

      const fetchedData = response.data;

      // Handle fetchedData as needed
      processKomootData(fetchedData);
      // setrouteData(fetchedData);
    } catch (error) {
      console.error("API request failed:", error);
      // Handle error as needed
    }
  };
  const fetchStrava = async () => {
    try {
      const url = API_URL_STRAVA + `?route_id=${routeConfig.route_id}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 200) {
        throw new Error("API request failed");
      }

      const fetchedData = response.data;
      // console.log(fetchedData);
      // Handle fetchedData as needed
      processStravaData(fetchedData);
      // setrouteData(fetchedData);
    } catch (error) {
      console.error("API request failed:", error);
      // Handle error as needed
    }
  };

  useEffect(() => {
    if (routeLink) {
      // console.log(routeLink);
      validateLink(routeLink);
    }
  }, [routeLink]);

  useEffect(() => {
    if (routeConfig?.service) {
      switch (routeConfig.service) {
        case "komoot":
          fetchKomoot();

          break;
        case "strava":
          fetchStrava();
          break;

        default:
          break;
      }
    } else {
      console.log("konnte nicht parsen");
    }

    // const { error } = useSWR(
    //   API_URL +
    //     `?tour_id=${processLink().tour_id}&share_token=${
    //       processLink().share_token
    //     }`,
    //   {
    //     fetcher: async (url) => {
    //       const response = await fetch(url, {
    //         method: "GET",
    //         headers: {
    //           "Content-Type": "application/json",
    //           // Onlyprops: "true",
    //           //   "User-Agent": "PostmanRuntime/7.32.2",
    //         },
    //       });

    //       if (!response.ok) {
    //         throw new Error("API request failed");
    //       }

    //       return response.json();
    //     },
    //     onSuccess: (fetchedData) => {
    //       //   console.log(fetchedData);
    //       processData(fetchedData);
    //       //   setrouteData(fetchedData);
    //     },
    //   }
    // );

    // if (error) {
    //   // Handle error state
    //   return <div>Error: {error.message}</div>;
    // }

    // if (!routeData) {
    //   // Loading state
    //   return <div>Loading...</div>;
    // }
  }, [routeConfig]);

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
      data.labels.push(coordinate?.t);
      data.datasets[0].data.push(coordinate?.alt);
    });

    return data;
  };

  const CoordinateChart = () => {
    // console.log(routeData);
    let coords = routeData.coordinates;
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

  const getLogo = () => {
    // console.log(routeConfig);
    switch (routeConfig.service) {
      case "komoot":
        return komootLogo;
      case "strava":
        return stravaLogo;

      default:
        break;
    }
  };

  return !routeData ? (
    <div>
      {" "}
      <MDBSpinner role="status">
        <span className="visually-hidden">Loading...</span>
      </MDBSpinner>
    </div>
  ) : (
    <div className="komoot-card">
      <div className="header">
        {" "}
        <div className="tourtitle">{routeData.name}</div>
      </div>
      <div className="komoot-body">
        {routeData.coordinates && (
          <div className="hoehenprofil">{CoordinateChart()}</div>
        )}
        {routeData.map_img && (
          <div className="hoehenprofil">
            <img src={routeData.map_img}></img>
          </div>
        )}
        <div className="tourprops">
          <div className="tourprop">
            <FontAwesomeIcon icon={faArrowsLeftRight} />
            {Math.round(routeData.distance / 1000)} km
          </div>
          {/* <div>{routeData.duration}</div> */}
          <div className="tourprop">
            <FontAwesomeIcon icon={faArrowUpRightDots} />
            {Math.round(routeData.elevation_up)} m
          </div>
          {routeData.elevation_down && (
            <div className="tourprop">
              <FontAwesomeIcon icon={faArrowTrendDown} />
              {Math.round(routeData.elevation_down)} m
            </div>
          )}
        </div>

        {/* <div>
        <img height={"250px"} src={routeData.map_image.src} alt="" />
      </div> */}

        <a href={routeLink} target="_blank">
          <img
            style={{ cursor: "pointer" }}
            height={"50px"}
            src={getLogo()}
          ></img>
        </a>
      </div>
    </div>
  );
}
