"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
} from "lucide-react";
import { QueryAdvocatesResponse, Advocate } from "@/app/api/advocates/service";
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
): Promise<QueryAdvocatesResponse> => {
  const response = await fetch(
    `/api/advocates?search=${search}&${direction}=${cursor}&limit=${limit}`,
  );
  if (!response.ok) {
    throw new Error("Network error");
  }
  return response.json();
};

const prefetchNextPage = (
  client: QueryClient,
  data: Advocate[],
  search: string,
  pageSize: number,
) => {
  client.prefetchQuery({
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

const prefetchPreviousPage = (
  client: QueryClient,
  data: Advocate[],
  search: string,
  pageSize: number,
) => {
  client.prefetchQuery({
    queryKey: ["advocates", search, data[0]?.id, "previous", pageSize],
    queryFn: () => fetchAdvocates(search, data[0]?.id, "previous", pageSize),
  });
};

const formatPhoneNumber = (phone: string) => {
  try {
    const phoneNumber = parsePhoneNumberWithError(phone, "US");
    return phoneNumber?.formatNational() || phone;
  } catch {
    return phone;
  }
};

const AdvocatesTable = () => {
  const queryClient = useQueryClient();
  const [filteredAdvocates, setFilteredAdvocates] = useState<Advocate[]>([]);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [search, setSearch] = useState<string>("");
  const [cursor, setCursor] = useState<CursorState>({
    cursor: null,
    direction: "next",
  });
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data, isLoading, isError, error } = useQuery<
    QueryAdvocatesResponse,
    Error
  >({
    queryKey: ["advocates", search, cursor.cursor, cursor.direction, pageSize],
    queryFn: () =>
      fetchAdvocates(search, cursor.cursor, cursor.direction, pageSize),
    keepPreviousData: true,
    staleTime: 5000,
    onSuccess: (response) => {
      if (response.data.length) {
        prefetchNextPage(queryClient, response.data, search, pageSize);
        prefetchPreviousPage(queryClient, response.data, search, pageSize);
      }
    },
  });

  useEffect(() => {
    if (!!data) {
      setHasNextPage(data.hasNextPage);
      setHasPreviousPage(data.hasPreviousPage);
      setFilteredAdvocates(data.data);
    }
  }, [data]);

  const handleSearch = useCallback((input: string) => {
    setSearch(input);
    setCursor({ cursor: null, direction: "next" });
  }, []);

  const handlePageSizeChange = (input: number) => {
    setPageSize(input);
    setCursor({ cursor: null, direction: "next" });
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        // Drizzlie shouldn't be linting this code.
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="text-red-500 p-8">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Solace Advocates</h1>

      <div className="flex items-center gap-6 mb-8">
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="h-10 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer pr-8 relative"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.5em 1.5em",
          }}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={15}>15 per page</option>
        </select>
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <DebouncedInput
            value={search}
            handleChange={handleSearch}
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Search advocates..."
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {!!filteredAdvocates.length && (
          <div className="flex gap-2">
            <button
              disabled={!hasPreviousPage}
              onClick={() =>
                setCursor({
                  cursor: filteredAdvocates[0].id,
                  direction: "previous",
                })
              }
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} className="mr-1" /> Previous
            </button>
            <button
              disabled={!hasNextPage}
              onClick={() =>
                setCursor({
                  cursor: filteredAdvocates[filteredAdvocates.length - 1].id,
                  direction: "next",
                })
              }
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={20} className="ml-1" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Degree
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialties
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(filteredAdvocates) &&
              filteredAdvocates.map((advocate) => {
                const isExpanded = expandedRows.has(advocate.id);
                return (
                  <tr
                    key={advocate.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRow(advocate.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown
                            size={20}
                            className="mr-2 text-gray-400"
                          />
                        ) : (
                          <ChevronRight
                            size={20}
                            className="mr-2 text-gray-400"
                          />
                        )}
                        <div>
                          <div className="font-medium">
                            {advocate.firstName}
                          </div>
                          <div className="text-gray-500">
                            {advocate.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{advocate.city}</td>
                    <td className="px-6 py-4">{advocate.degree}</td>
                    <td className="px-6 py-4">
                      {isExpanded ? (
                        <div className="space-y-1">
                          {advocate.specialties.map((specialty, idx) => (
                            <div
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm mr-2 mb-2"
                            >
                              {specialty}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="truncate max-w-xs">
                            {advocate.specialties[0]}
                          </span>
                          {advocate.specialties.length > 1 && (
                            <span className="ml-2 text-sm text-gray-500">
                              +{advocate.specialties.length - 1} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {advocate.yearsOfExperience} years
                    </td>
                    <td className="px-6 py-4">
                      {formatPhoneNumber(advocate.phoneNumber.toString())}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvocatesTable;
