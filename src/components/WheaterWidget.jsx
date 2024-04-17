import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const WeatherWidget = (props) => {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherIcon, setWeatherIcon] = useState(null);
  const [searchDate, setSearchDate] = useState(props.searchDate);
  const [searchTime, setSearchTime] = useState(props.searchTime);

  useEffect(() => {
    // Fetch weather data for the given city using an API
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?appid=3e512fd69b5b93d2c11e8a0c425e8efb&units=metric&lang=de&lat=49.583332&lon=11.016667`
    )
      .then((response) => response.json())
      .then((data) => {
        let list = data.list;

        // let dt = searchDate + " " + getNextClosestTime(searchTime) + ":00";
        let dt = searchDate + " " + "15:00" + ":00";
        // console.log(dt);
        list.forEach((element) => {
          if (element.dt_txt == dt) {
            console.log("treffer");
            console.log(element);
            console.log(searchTime);
            setWeatherData(element);
            setWeatherIcon(
              `https://openweathermap.org/img/w/${element.weather[0].icon}.png`
            );
          }
        });
      });
  }, []);

  //   if (!weatherData) {
  //     return <div>Loading weather data...</div>;
  //   }

  const format = "YYYY-MM-DD HH:MM:SS";

  //   function getNextClosestTime(time) {
  //     const times = [
  //       "00:00",
  //       "03:00",
  //       "06:00",
  //       "09:00",
  //       "12:00",
  //       "15:00",
  //       "18:00",
  //       "21:00",
  //     ];
  //     // wandeln die Zeit in einen String um, falls es sich um eine Zahl handelt
  //     if (typeof time === "number") {
  //       time = time.toString();
  //     }

  //     // time = String(time); // Umwandlung von number in string

  //     const [hours, minutes] = time.split(":").map(Number);
  //     const totalMinutes = hours * 60 + minutes;

  //     let closestTime = times[0];
  //     let closestTimeMinutes = getDifference(totalMinutes, times[0]);

  //     for (let i = 1; i < times.length; i++) {
  //       const currentTimeMinutes = getMinutes(times[i]);
  //       const difference = getDifference(totalMinutes, currentTimeMinutes);

  //       if (difference < closestTimeMinutes) {
  //         closestTime = times[i];
  //         closestTimeMinutes = difference;
  //       }
  //     }

  //     return closestTime;
  //   }

  //   function getMinutes(time) {
  //     if (typeof time === "number") {
  //       time = time.toString();
  //     }
  //     const [hours, minutes] = time.split(":").map(Number);
  //     return hours * 60 + minutes;
  //   }

  //   function getDifference(time1, time2) {
  //     const minutesInDay = 1440;
  //     const diff = getMinutes(time2) - time1;
  //     return diff < 0 ? diff + minutesInDay : diff;
  //   }

  return (
    weatherData && (
      <div>
        <div>
          <img src={weatherIcon} />
        </div>
        <div>{weatherData.weather[0].description}</div>
        <div>{Math.round(weatherData.main.temp)}°C</div>
        {/* <div>{weatherData.wind.speed}</div> */}
      </div>
    )
  );
};

export default WeatherWidget;
