import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ArrowUpDown,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

type SortField =
  | "id"
  | "campaignName"
  | "promotionCode"
  | "selectedCustomers"
  | "messageSendTime"
  | "status"
  | "totalCost"
  | "createdAt";

interface PromotionCampaign {
  id: number;
  campaignName: string;
  promotionCode: string;
  promotionMessage: string;
  messageSendTime: string;
  customerIds: any[];
  paymentIntentId: string;
  status: string;
  totalCost: number;
  createdAt: string;
}
type SortDirection = "asc" | "desc";

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return {
          icon: Clock,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          label: "Pending",
        };
      case "paid":
        return {
          icon: DollarSign,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          label: "Paid",
        };
      case "scheduled":
        return {
          icon: Calendar,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          label: "Scheduled",
        };
      case "rejected":
        return {
          icon: XCircle,
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          label: "Rejected",
        };
      case "completed":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          label: "Completed",
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          label: status,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}
    >
      <Icon size={16} className="mr-1.5" />
      {config.label}
    </span>
  );
}

export default function ManagePromotions() {
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      try {
        const response = await axiosWithToken.get("/promotion-campaigns");
        setPromotions(response.data.content);
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const filteredPromotions = promotions.filter((promotion) => {
    const matchesSearch =
      promotion.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.promotionCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || promotion.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedPromotions = [...filteredPromotions].sort((a, b) => {
    let compareA: string | number | Date = "";
    let compareB: string | number | Date = "";

    switch (sortField) {
      case "id":
        compareA = a.id;
        compareB = b.id;
        break;
      case "campaignName":
        compareA = a.campaignName.toLowerCase();
        compareB = b.campaignName.toLowerCase();
        break;
      case "promotionCode":
        compareA = a.promotionCode.toLowerCase();
        compareB = b.promotionCode.toLowerCase();
        break;
      case "selectedCustomers":
        compareA = a.customerIds.length;
        compareB = b.customerIds.length;
        break;
      case "messageSendTime":
        compareA = new Date(a.messageSendTime);
        compareB = new Date(b.messageSendTime);
        break;
      case "status":
        compareA = a.status.toLowerCase();
        compareB = b.status.toLowerCase();
        break;
      case "totalCost":
        compareA = a.totalCost;
        compareB = b.totalCost;
        break;
      case "createdAt":
        compareA = new Date(a.createdAt);
        compareB = new Date(b.createdAt);
        break;
    }

    if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
    if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedPromotions.length / pageSize);
  const paginatedPromotions = sortedPromotions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <ArrowUpDown
            size={14}
            className={`transition-opacity ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            } 
              ${isActive && sortDirection === "desc" ? "rotate-180" : ""}`}
          />
        </div>
      </th>
    );
  };

  const formatDate = (date: string) => {
    return moment(date, "DD/MM/YYYY HH:mm").format("MMM D, YYYY, hh:mm A");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading promotions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Promotions
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your promotion campaigns
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search promotions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="id">ID</SortableHeader>
                  <SortableHeader field="campaignName">Campaign</SortableHeader>
                  <SortableHeader field="promotionCode">Code</SortableHeader>
                  <SortableHeader field="selectedCustomers">
                    Recipients
                  </SortableHeader>
                  <SortableHeader field="createdAt">Created</SortableHeader>
                  <SortableHeader field="messageSendTime">
                    Send Time
                  </SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="totalCost">Cost</SortableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPromotions.map((promotion, index) => (
                  <tr
                    key={promotion.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {promotion.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {promotion.campaignName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {promotion.promotionMessage}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {promotion.promotionCode}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users size={16} className="mr-1.5 text-gray-400" />
                        {promotion.customerIds.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={16} className="mr-1.5 text-gray-400" />
                        {formatDate(promotion.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock size={16} className="mr-1.5 text-gray-400" />
                        <div className="flex flex-col">
                          <span>{formatDate(promotion.messageSendTime)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={promotion.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <DollarSign
                          size={16}
                          className="mr-1.5 text-gray-400"
                        />
                        {promotion.totalCost.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedPromotions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min(
                      (currentPage - 1) * pageSize + 1,
                      sortedPromotions.length
                    )}
                  </span>{" "}
                  -{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, sortedPromotions.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{sortedPromotions.length}</span>{" "}
                  results
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 rounded-md disabled:text-gray-300 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md disabled:text-gray-300 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
