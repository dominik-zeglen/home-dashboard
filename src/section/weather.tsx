import React from "react";
import {
  useDeleteCity,
  usePutCity,
  useWeather,
  WeatherData,
} from "../api/weather";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function AddCity() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const { mutate: addCity } = usePutCity(() => {
    setOpen(false);
  });

  const submit = (
    e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    addCity({ data: { name } });
  };

  React.useEffect(() => {
    setName("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative bottom-2 left-2"
        >
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add City</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <Input
              type="text"
              placeholder="City name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </DialogDescription>
          <DialogFooter>
            <Button onClick={submit}>Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function City({
  city,
  country,
  description,
  temperature,
  id,
  openweathermap_id,
}: WeatherData) {
  const { mutate: removeCity } = useDeleteCity();

  const remove = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    removeCity({ id });
  };

  return (
    <div className="mb-4 last:mb-0">
      <h5 className="text-lg font-semibold">
        <span>
          {city}, {country}
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          className="ml-2 p-0.5 float-right relative top-0.5"
          onClick={remove}
        >
          <Trash />
        </Button>
      </h5>
      <div>
        {temperature.toFixed(0)} °C, {description}
      </div>
      <a
        href={`https://openweathermap.org/city/${openweathermap_id}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-gray-500 hover:underline"
      >
        More...
      </a>
    </div>
  );
}

export function Weather() {
  const { data } = useWeather();

  if (!data)
    return (
      <Card>
        <Loader className="animate-spin mx-auto" />
      </Card>
    );

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <CardTitle>Weather</CardTitle>
        <AddCity />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-gray-300">No weather locations</div>
        ) : (
          data.map((city) => <City {...city} key={city.id} />)
        )}
      </CardContent>
    </Card>
  );
}
