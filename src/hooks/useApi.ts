import React from "react";

export function useApi<TData extends object = {}>(url: string) {
  const [data, setData] = React.useState<TData>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error>();

  React.useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
}
