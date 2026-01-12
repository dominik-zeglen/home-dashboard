import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pin } from "lucide-react";
import { useSystemdUnits, SystemdUnit, usePinService } from "../api/service";

const TABS = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
	{ value: "failed", label: "Failed" },
];

function Unit({
	name,
	state,
	sub_state,
	description,
	pinned,
	onPin,
}: SystemdUnit & { onPin: () => void }) {
	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				className="h-6 w-6"
				onClick={onPin}
				title={pinned ? "Unpin" : "Pin"}
			>
				<Pin className={`h-3 w-3 ${pinned ? "fill-current" : ""}`} />
			</Button>
			<span className="overflow-hidden text-ellipsis text-nowrap font-mono text-sm">
				{name}
			</span>
			<Badge
				variant={state === "active" ? "default" : state === "failed" ? "destructive" : "secondary"}
				className="justify-self-center"
			>
				{sub_state}
			</Badge>
			<span className="text-sm text-muted-foreground overflow-hidden text-ellipsis text-nowrap">
				{description}
			</span>
		</>
	);
}

export function Services() {
	const [open, setOpen] = React.useState(true);
	const [tab, setTab] = React.useState("all");
	const [search, setSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const { mutate: pinService } = usePinService();

	React.useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, 300);
		return () => clearTimeout(timeout);
	}, [search]);

	React.useEffect(() => {
		setPage(1);
	}, [tab]);

	const { data, isLoading } = useSystemdUnits({
		state: tab,
		search: debouncedSearch,
		page,
		limit: 10,
	});

	return (
		<Card className="mb-4">
			<CardHeader className="flex justify-between">
				<CardTitle>Systemd Services</CardTitle>
				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="relative left-2 bottom-2"
				>
					{open ? <ChevronUp /> : <ChevronDown />}
				</Button>
			</CardHeader>
			{open && (
				<>
					<CardContent className="flex gap-2 flex-wrap">
						{TABS.map((t) => (
							<Button
								key={t.value}
								variant={tab === t.value ? "default" : "outline"}
								size="sm"
								onClick={() => setTab(t.value)}
							>
								{t.label}
							</Button>
						))}
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search..."
							className="w-48 ml-auto"
						/>
					</CardContent>
					<CardContent className="grid gap-2 grid-cols-[28px_1fr_80px_2fr] items-center">
						<span />
						<span className="text-xs text-muted-foreground font-medium">Unit</span>
						<span className="text-xs text-muted-foreground font-medium text-center">State</span>
						<span className="text-xs text-muted-foreground font-medium">Description</span>
						{isLoading ? (
							<span className="col-span-4 text-center text-muted-foreground py-4">Loading...</span>
						) : data?.units.length === 0 ? (
							<span className="col-span-4 text-center text-muted-foreground py-4">No services found</span>
						) : (
							data?.units.map((unit) => (
								<Unit
									key={unit.name}
									{...unit}
									onPin={() => pinService({ name: unit.name, pinned: unit.pinned })}
								/>
							))
						)}
					</CardContent>
					{data && data.pages > 1 && (
						<CardContent className="flex items-center justify-center gap-4">
							<Button
								variant="outline"
								size="icon"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft />
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {data.page} of {data.pages}
							</span>
							<Button
								variant="outline"
								size="icon"
								disabled={page >= data.pages}
								onClick={() => setPage((p) => p + 1)}
							>
								<ChevronRight />
							</Button>
						</CardContent>
					)}
				</>
			)}
		</Card>
	);
}
