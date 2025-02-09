import React from "react";
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { axiosWithToken } from "../utils/axios";

const ITEMS_PER_PAGE = 10;

interface Props {
  selectedCustomers: Customer[];
  onCustomerSelect: (customers: Customer[]) => void;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems, // Added totalItems prop
}: PaginationProps & { totalItems: number }) { // Updated PaginationProps interface
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center">
        <p className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
          </span>
          {" to "}
          <span className="font-medium">
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
          </span>
          {" of "}
          <span className="font-medium">{totalItems}</span> Customers
        </p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded-md disabled:text-gray-300 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded-md disabled:text-gray-300 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default function PromotionCustomerSelection({
  selectedCustomers,
  onCustomerSelect,
}: Props) {
  const [selectedSearchTerm, setSelectedSearchTerm] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [availablePage, setAvailablePage] = React.useState(1);
  const [selectedPage, setSelectedPage] = React.useState(1);
  const [customersData, setCustomersData] = React.useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = React.useState(0);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);

  React.useEffect(() => {
    fetchCustomers(availablePage);
  }, [availablePage]);

  const fetchCustomers = async (page: number) => {
    try {
      const response = await axiosWithToken.get(`/customer/search`, {
        params: {
          page: page - 1,
          size: ITEMS_PER_PAGE,
          sort: "id,DESC",
          filterBlacklisted: true,
          searchString: "",
        },
      });
      setCustomersData(response.data.content);
      setTotalCustomers(response.data.totalElements);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllCustomers = async () => {
    const firstPage = await axiosWithToken.get("/customer/search", {
      params: { page: 0, size: ITEMS_PER_PAGE, sort: "id,DESC", filterBlacklisted: true, searchString: "" },
    });
    const totalPageCount = Math.ceil(firstPage.data.totalElements / ITEMS_PER_PAGE);
    let accumulated: Customer[] = firstPage.data.content;

    for (let p = 1; p < totalPageCount; p++) {
      const res = await axiosWithToken.get("/customer/search", {
        params: { page: p, size: ITEMS_PER_PAGE, sort: "id,DESC", filterBlacklisted: true, searchString: "" },
      });
      accumulated = [...accumulated, ...res.data.content];
    }
    setAllCustomers(accumulated);
  };

  const filteredCustomers = customersData.filter(
    (customer) => !selectedCustomers.some((c) => c.id === customer.id)
  );

  const filteredSelectedCustomers = selectedCustomers.filter(
    (customer) =>
      customer.firstName
        .toLowerCase()
        .includes(selectedSearchTerm.toLowerCase()) ||
      customer.lastName
        .toLowerCase()
        .includes(selectedSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(selectedSearchTerm.toLowerCase())
  );

  const addCustomer = (customer: Customer) => {
    onCustomerSelect([...selectedCustomers, customer]);
  };

  const removeCustomer = (customer: Customer) => {
    onCustomerSelect(selectedCustomers.filter((c) => c.id !== customer.id));
  };

  const addAllCustomers = async () => {
    await fetchAllCustomers();

    // Create a Set of selected customer IDs for faster lookup
    const selectedCustomerIds = new Set(selectedCustomers.map((c) => c.id));

    // Filter allCustomers to include only those not already selected
    const newCustomers = allCustomers.filter((c) => !selectedCustomerIds.has(c.id));

    onCustomerSelect([...selectedCustomers, ...newCustomers]);
  };

  const removeAllCustomers = () => {
    onCustomerSelect([]);
  };

  const paginateCustomers = (customers: Customer[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return customers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (totalItems: number) =>
    Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedSelectedCustomers = paginateCustomers(
    filteredSelectedCustomers,
    selectedPage
  );

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Select Customers
        </h2>
        <p className="text-gray-600">
          Choose the customers who will receive this promotion. At least two customers are required.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Available Customers */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users size={20} className="text-blue-500" />
                  <span className="font-medium">Available Customers</span>
                </div>
                <button
                  onClick={addAllCustomers}
                  disabled={filteredCustomers.length === 0}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <UserPlus size={16} />
                  <span>Add All</span>
                </button>
              </div>
              <div className="mt-2 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search available customers..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-[calc(100vh-20rem)] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No customers available
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {customer.firstName + " " + customer.lastName}{" "}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        {customer.email && <p>{customer.email}</p>}
                        {customer.phone && <p>{customer.phone}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => addCustomer(customer)}
                      className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                    >
                      <UserPlus size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {filteredCustomers.length > 0 && (
              <Pagination
                currentPage={availablePage}
                totalPages={getTotalPages(totalCustomers)}
                onPageChange={setAvailablePage}
                totalItems={totalCustomers} // Passing totalItems prop
              />
            )}
          </div>
        </div>

        {/* Selected Customers */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck size={20} className="text-green-500" />
                  <span className="font-medium">Selected Customers</span>
                  <span className="text-sm text-gray-500">
                    ({selectedCustomers.length})
                  </span>
                </div>
                <button
                  onClick={removeAllCustomers}
                  disabled={selectedCustomers.length === 0}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <UserX size={16} />
                  <span>Remove All</span>
                </button>
              </div>
              <div className="mt-2 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search selected customers..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSearchTerm}
                  onChange={(e) => setSelectedSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-[calc(100vh-20rem)] overflow-y-auto">
              {selectedCustomers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No customers selected
                </div>
              ) : (
                paginatedSelectedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {customer.firstName + " " + customer.lastName}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        {customer.email && <p>{customer.email}</p>}
                        {customer.phone && <p>{customer.phone}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCustomer(customer)}
                      className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                    >
                      <UserMinus size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {filteredSelectedCustomers.length > 0 && (
              <Pagination
                currentPage={selectedPage}
                totalPages={getTotalPages(filteredSelectedCustomers.length)}
                onPageChange={setSelectedPage}
                totalItems={filteredSelectedCustomers.length} // Passing totalItems
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
