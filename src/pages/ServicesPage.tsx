import CategoryDialog from "@/components/CategoryDialog";
import isTokenExpired from "@/helper/CheckTokenExpired";
import { refreshToken } from "@/helper/RefreshToken";
import { getToken } from "@/helper/getToken";
import { axiosWithToken } from "@/utils/axios";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";

interface Service {
  id: number;
  name: string;
  description: string;
}

interface Category {
  id: number;
  type: string;
  services: Service[];
}

const ServicesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [serviceName, setServiceName] = useState<string>("");
  const [serviceDescription, setServiceDescription] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        refreshToken();
      }
    } else {
      router.push("/session-expired");
    }
  }, [router]);

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get<any[]>(`/serviceType/`);
      setCategories(response.data);
      setError(null);
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: categories.length + 1,
      type: categoryName,
      services: [],
    };
    setCategories([...categories, newCategory]);
    setCategoryName("");
  };

  const handleEditCategory = (id: number, name: string) => {
    setCategories(
      categories.map((category) =>
        category.id === id ? { ...category, name } : category
      )
    );
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter((category) => category.id !== id));
  };

  const handleAddService = (categoryId: number) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              services: [
                ...category.services,
                {
                  id: category.services.length + 1,
                  name: serviceName,
                  description: serviceDescription,
                },
              ],
            }
          : category
      )
    );
    setServiceName("");
    setServiceDescription("");
  };

  const handleEditService = (
    categoryId: number,
    serviceId: number,
    name: string,
    description: string
  ) => {
    setCategories(
      categories?.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              services: category.services.map((service) =>
                service.id === serviceId
                  ? { ...service, name, description }
                  : service
              ),
            }
          : category
      )
    );
  };

  const handleDeleteService = (categoryId: number, serviceId: number) => {
    setCategories(
      categories?.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              services: category.services.filter(
                (service) => service.id !== serviceId
              ),
            }
          : category
      )
    );
  };

  return (
    <div className="p-4 md:w-[80%] mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold mb-2">Type</h2>
        <CategoryDialog />
      </div>

      {categories.map((category) => (
        <div key={category.id} className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">{category.type}</h3>
            <div>
            <CategoryDialog edit={true}/>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-md font-bold mb-2">Add Service</h4>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="border p-2 mb-2 w-full"
              placeholder="Service Name"
            />
            <input
              type="text"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className="border p-2 mb-2 w-full"
              placeholder="Service Description"
            />
            <button
              onClick={() => handleAddService(category.id)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Service
            </button>
          </div>

          <div>
            {category?.services?.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center mb-2"
              >
                <div>
                  <div className="text-md font-bold">{service.name}</div>
                  <div className="text-sm">{service.description}</div>
                </div>
                <div>
                  <button
                    onClick={() =>
                      handleEditService(
                        category.id,
                        service.id,
                        prompt("Enter new service name:", service.name) ||
                          service.name,
                        prompt(
                          "Enter new service description:",
                          service.description
                        ) || service.description
                      )
                    }
                    className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(category.id, service.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicesPage;
