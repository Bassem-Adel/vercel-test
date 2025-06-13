// components/spaces/spaces.tsx
'use client';
import type { Space } from '@/lib/db/schema';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaRedo } from "react-icons/fa";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function getSpaces() {
    setLoading(true); // Set loading state to true while fetching
    try {

      const res = await fetch('/api/space');
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      } else {
        setSpaces([]);
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
      setSpaces([]); // Fallback on error
    } finally {
      setLoading(false); // Set loading to false after fetching is done
    }

  }

  useEffect(() => {
    getSpaces();
  }, []);

  return (
    // <div className="max-w-2xl mx-auto py-8 px-4">
    <div className="flex-1 py-8 px-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <CheckCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            <h1 className="font-semibold text-2xl">Spaces</h1>
          </div>
          <Button variant="outline" size="icon" onClick={getSpaces} disabled={loading}>
            <FaRedo className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {spaces.length === 0 ? (
          <p>No spaces available. Start your game now :)</p>
        ) : (
          <div
            className="
              grid 
              gap-4 
              grid-cols-1 
              sm:grid-cols-2 
              md:grid-cols-3 
              lg:grid-cols-4
            "
          >
            {spaces.map((space) => (
              <div key={space.id} className="border rounded-lg p-4 flex flex-col justify-between h-full">
                <div>
                  <h6 className="font-semibold">{space.name}</h6>
                  <p className="text-sm text-muted-foreground">
                    Created on: {new Date(space.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/${space.id}/admin`}>Go to Space</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
