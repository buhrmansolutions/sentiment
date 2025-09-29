import logo from "./logo.svg";
import "./App.css";
import { getSentiments } from "./api/index";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

// Konvertera datumsträngar till något mer standardiserat (t.ex. "2025-09-20 10:15")
function parseDate(str) {
  // OBS: Detta är en enkel parser för demo. I verkligheten använd gärna dayjs eller date-fns
  const parts = str.split(", ");
  return parts[1]; // "10:15", men du kan välja att visa hela parts[0] också
}

function App() {
  const [sentiments, setSentiments] = useState([]);

  useEffect(() => {
    const fetchSentiments = async () => {
      const data = await getSentiments();
      console.log({ data });
      setSentiments(data);
    };
    fetchSentiments();
  }, []);

  const formattedData = sentiments.map((d) => ({
    ...d,
    time: parseDate(d.date), // ny field för x-axeln
  }));
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" name="Värde" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
