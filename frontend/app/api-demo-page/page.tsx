"use client";
import { useEffect, useState } from "react";

export default function ApiDemo() {
  const [weather, setWeather] = useState<unknown>(null);
  const [health, setHealth] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASEURL;

  useEffect(() => {
    Promise.all([
      fetch(`${apiBaseUrl}/weatherforecast`).then((res) => {
        if (!res.ok) throw new Error("/weatherforecast API error");
        return res.json();
      }),
      fetch(`${apiBaseUrl}/health`).then((res) => {
        if (!res.ok) throw new Error("/health API error");
        return res.json().catch(() => res.text());
      }),
    ])
      .then(([weatherData, healthData]) => {
        setWeather(weatherData);
        setHealth(healthData);
      })
      .catch((err) => setError(err.message));
  }, [apiBaseUrl]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">API Demo Page</h2>
      <p className="mb-2 text-zinc-600">
        Base URL: <span className="font-mono">{apiBaseUrl}</span>
      </p>
      {error && <div className="text-red-600">Error: {error}</div>}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">/weatherforecast</h3>
        {weather ? (
          <pre className="bg-zinc-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(weather, null, 2)}
          </pre>
        ) : !error ? (
          <div>Loading...</div>
        ) : null}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">/health</h3>
        {health ? (
          <pre className="bg-zinc-100 p-4 rounded text-sm overflow-x-auto">
            {typeof health === "string"
              ? health
              : JSON.stringify(health, null, 2)}
          </pre>
        ) : !error ? (
          <div>Loading...</div>
        ) : null}
      </div>
    </div>
  );
}
