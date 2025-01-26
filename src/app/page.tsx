"use client";

import { useEffect, useState } from "react";
import { Advocate } from "@/app/api/advocates/service";

export default function Home() {
  const pageSize = 5;
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);
  const [cursorForward, setCursorForward] = useState<number | undefined>(
    undefined,
  );
  const [cursorBackward, setCursorBackward] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    console.log("fetching advocates...");
    // Believe URL is sufficiently sanatized and protected from malicious input.
    fetch(`/api/advocates?limit=${pageSize}`).then((response) => {
      response.json().then((jsonResponse) => {
        setAdvocates(jsonResponse.data);
        setFilteredAdvocates(jsonResponse.data);
      });
    });
  }, []);

  useEffect(() => {
    if (cursorForward !== undefined) {
      console.log("fetching next page of advocates...");
      // Believe URL is sufficiently sanatized and protected from malicious input.
      fetch(`/api/advocates?next=${cursorForward}&limit=${pageSize}`).then(
        (response) => {
          response.json().then((jsonResponse) => {
            setAdvocates(jsonResponse.data);
            setFilteredAdvocates(jsonResponse.data);
          });
        },
      );
      setCursorForward(undefined);
    } else if (cursorBackward !== undefined) {
      console.log("fetching prev page of advocates...");
      // Believe URL is sufficiently sanatized and protected from malicious input.
      fetch(`/api/advocates?previous=${cursorBackward}&limit=${pageSize}`).then(
        (response) => {
          response.json().then((jsonResponse) => {
            setAdvocates(jsonResponse.data);
            setFilteredAdvocates(jsonResponse.data);
          });
        },
      );
      setCursorBackward(undefined);
    }
  }, [cursorForward, cursorBackward]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;

    const element = document.getElementById("search-term");
    if (!element) {
      return;
    }

    element.innerHTML = searchTerm;

    console.log("filtering advocates...");
    const filteredAdvocates = advocates.filter((advocate) => {
      return (
        advocate.firstName.includes(searchTerm) ||
        advocate.lastName.includes(searchTerm) ||
        advocate.city.includes(searchTerm) ||
        advocate.degree.includes(searchTerm) ||
        advocate.specialties.includes(searchTerm) ||
        advocate.yearsOfExperience === Number(searchTerm)
      );
    });

    setFilteredAdvocates(filteredAdvocates);
  };

  const onClick = () => {
    console.log(advocates);
    setFilteredAdvocates(advocates);
  };

  return (
    <main style={{ margin: "24px" }}>
      <h1>Solace Advocates</h1>
      <br />
      <br />
      <div>
        <p>Search</p>
        <p>
          Searching for: <span id="search-term"></span>
        </p>
        <input style={{ border: "1px solid black" }} onChange={onChange} />
        <button onClick={onClick}>Reset Search</button>
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
      {!!advocates.length && (
        <div>
          <button
            onClick={() => {
              setCursorBackward(advocates[0].id);
            }}
          >
            Prev page
          </button>
          <button
            onClick={() => {
              setCursorForward(advocates[advocates.length - 1].id);
            }}
          >
            Next page
          </button>
        </div>
      )}
    </main>
  );
}
