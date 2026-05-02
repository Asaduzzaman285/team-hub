import { useState, useCallback } from "react";

/**
 * Hook for managing optimistic UI updates
 * @param {Array} initialData - The initial state of the list
 * @param {Function} apiCall - The function that makes the actual API request
 */
export const useOptimisticList = (initialData = [], apiCall) => {
  const [data, setData] = useState(initialData);

  const performAction = useCallback(async (actionType, payload) => {
    const previousData = [...data];

    // Optimistic Update
    if (actionType === "CREATE") {
      setData((prev) => [{ ...payload, id: "temp-" + Date.now(), isOptimistic: true }, ...prev]);
    } else if (actionType === "UPDATE") {
      setData((prev) => prev.map((item) => (item.id === payload.id ? { ...item, ...payload } : item)));
    } else if (actionType === "DELETE") {
      setData((prev) => prev.filter((item) => item.id !== payload.id));
    }

    try {
      const result = await apiCall(actionType, payload);
      
      // Replace temporary ID with real one if needed
      if (actionType === "CREATE") {
        setData((prev) => prev.map((item) => (item.isOptimistic ? result : item)));
      } else {
        setData((prev) => prev.map((item) => (item.id === payload.id ? result : item)));
      }
      return result;
    } catch (error) {
      // Rollback on error
      setData(previousData);
      throw error;
    }
  }, [data, apiCall]);

  return [data, performAction, setData];
};
