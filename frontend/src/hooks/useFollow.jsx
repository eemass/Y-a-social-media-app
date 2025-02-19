import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const useFollow = ({ id }) => {
  const queryClient = useQueryClient();

  const { mutate: follow, isPending } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/user/follow/${id}`, { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong.");
        }

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggestedUsersKey"] }),
        queryClient.invalidateQueries({ queryKey: ["authUserKey"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  return { follow, isPending };
};

export default useFollow;
