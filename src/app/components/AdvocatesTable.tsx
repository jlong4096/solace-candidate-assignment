"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Advocate } from "@/app/api/advocates/service";
import DebouncedInput from "./DebouncedInput";

const PAGE_SIZE = 5;

interface CursorState {
  cursor: number | null;
  direction: "next" | "previous";
}

const fetchAdvocates = async (
  search: string,
  cursor: number | null,
  direction: "next" | "previous",
  limit = PAGE_SIZE,
): Promise<Advocate[]> => {
  const response = await fetch(
    `/api/advocates?search=${search}&${direction}=${cursor}&limit=${limit}`,
  );
  if (!response.ok) {
    throw new Error("Network error");
  }
  return (await response.json()).data;
};

const AdvocatesTable = () => {
  const queryClient = useQueryClient();
  const pageSize = PAGE_SIZE;
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);
  const [search, setSearch] = useState<string>("");
  const [cursor, setCursor] = useState<CursorState>({
    cursor: null,
    direction: "next",
  });

  const prefetchNextPage = (data: Advocate[]) => {
    queryClient.prefetchQuery({
      queryKey: [
        "advocates",
        search,
        data[data.length - 1]?.id,
        "next",
        pageSize,
      ],
      queryFn: () =>
        fetchAdvocates(search, data[data.length - 1]?.id, "next", pageSize),
    });
  };

  const prefetchPreviousPage = (data: Advocate[]) => {
    queryClient.prefetchQuery({
      queryKey: ["advocates", search, data[0]?.id, "previous", pageSize],
      queryFn: () => fetchAdvocates(search, data[0]?.id, "previous", pageSize),
    });
  };

  const { data, isLoading, isError, error } = useQuery<Advocate[], Error>({
    queryKey: ["advocates", search, cursor.cursor, cursor.direction, pageSize],
    queryFn: () =>
      fetchAdvocates(search, cursor.cursor, cursor.direction, pageSize),
    keepPreviousData: true,
    staleTime: 5000,
    onSuccess: (data) => {
      if (data.length) {
        console.log("prefetching...");
        prefetchNextPage(data);
        prefetchPreviousPage(data);
      }
    },
  });

  useEffect(() => {
    if (!!data) {
      setFilteredAdvocates(data);
    }
  }, [data]);

  const onChange = (input: string) => {
    setSearch(input);
  };

  if (isLoading) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span> Error: {error.message}</span>;
  }

  return (
    <div>
      <h1>Solace Advocates</h1>
      <br />
      <br />
      <div>
        <p>Search</p>
        <p>
          Searching for: <span id="search-term"></span>
        </p>
        <DebouncedInput
          style={{ border: "1px solid black" }}
          handleChange={onChange}
        />
        {/*
        <input style={{ border: "1px solid black" }} onChange={onChange} />
        <button onClick={onClick}>Reset Search</button>
        */}
      </div>
      <br />
      <br />
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>City</th>
            <th>Degree</th>
            <th>Specialties</th>
            <th>Years of Experience</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(filteredAdvocates) &&
            filteredAdvocates.map((advocate) => {
              return (
                <tr key={advocate.id}>
                  <td>{advocate.firstName}</td>
                  <td>{advocate.lastName}</td>
                  <td>{advocate.city}</td>
                  <td>{advocate.degree}</td>
                  <td>
                    {advocate.specialties.map((s, idx) => (
                      <div key={idx}>{s}</div>
                    ))}
                  </td>
                  <td>{advocate.yearsOfExperience}</td>
                  <td>{advocate.phoneNumber}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {!!filteredAdvocates.length && (
        <div>
          <button
            onClick={() => {
              setCursor({
                cursor: filteredAdvocates[0].id,
                direction: "previous",
              });
            }}
          >
            Prev page
          </button>
          <button
            onClick={() => {
              setCursor({
                cursor: filteredAdvocates[filteredAdvocates.length - 1].id,
                direction: "next",
              });
            }}
          >
            Next page
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvocatesTable;
