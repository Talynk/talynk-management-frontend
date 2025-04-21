import { useEffect, useState } from "react";
import { Payment, columns } from "./columns";
import { DataTable } from "./data-table";

// Mock function to fetch data
async function getData(): Promise<Payment[]> {
  return [
    {
      id: "728ed52g",
      amount: 140,
      status: "pending",
      email: "laulanyumbayire@gmail.com",
    },
    {
      id: "728ed52g",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "728ed52g",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "728ed52g",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "728ed52g",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...other entries
  ];
}

export default function DemoPage() {
  const [data, setData] = useState<Payment[]>([]); // State to store data
  const [loading, setLoading] = useState<boolean>(true); // State to track loading

  // Fetch data when the component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getData();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Render loading state or the data table
  return (
    <div className="container mx-auto py-3">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
