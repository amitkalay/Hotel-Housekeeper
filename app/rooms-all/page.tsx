"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  room_number: string;
  hotel_id: string;
  status: string;
  hotels: { name: string } | null;
};

export default function RoomsAllPage() {
  const [rooms, setRooms] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rooms/all")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRooms(d.rooms ?? []);
      })
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-3 text-lg font-semibold">All rooms (beta)</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left">
            <th className="border-b py-2 pr-2">Hotel</th>
            <th className="border-b py-2 pr-2">Room</th>
            <th className="border-b py-2 pr-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id}>
              <td className="border-b py-1 pr-2">{r.hotels?.name ?? r.hotel_id}</td>
              <td className="border-b py-1 pr-2">{r.room_number}</td>
              <td className="border-b py-1 pr-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
