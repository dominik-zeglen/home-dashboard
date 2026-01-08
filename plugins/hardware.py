import subprocess
import time
import os


def get_uptime():
    result = subprocess.run(
        ["uptime", "-p"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    return result.stdout.strip()


def get_temperature():
    try:
        for dir in os.listdir("/sys/class/thermal/"):
            if dir.startswith("thermal_zone"):
                try:
                    with open(f"/sys/class/thermal/{dir}/type", "r") as f:
                        type_str = f.read().strip().lower()
                        if "cpu" in type_str or "soc" in type_str or "pkg_temp" in type_str:
                            with open(f"/sys/class/thermal/{dir}/temp", "r") as temp_f:
                                temp_milli = int(temp_f.read().strip())
                                return str(temp_milli / 1000.0)
                except (OSError, ValueError):
                    continue
    except OSError:
        pass

    try:
        result = subprocess.run(
            ["vcgencmd", "measure_temp"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        return result.stdout.strip().split("=")[1].split("'")[0]
    except (OSError, IndexError):
        return "N/A"


def read_all_cpu_stats():
    cpu_stats = {}
    with open("/proc/stat", "r") as f:
        for line in f:
            if line.startswith("cpu"):
                parts = line.strip().split()
                cpu_label = "all" if parts[0] == "cpu" else f"core{parts[0][3:]}"
                values = list(map(int, parts[1:]))
                cpu_stats[cpu_label] = values
            else:
                break  # Stop once non-CPU lines start
    return cpu_stats


def calculate_idle_percent(before, after):
    percentages = {}
    for cpu in before:
        total_before = sum(before[cpu])
        idle_before = before[cpu][3]

        total_after = sum(after[cpu])
        idle_after = after[cpu][3]

        total_delta = total_after - total_before
        idle_delta = idle_after - idle_before

        if total_delta > 0:
            idle_pct = 100 - (idle_delta / total_delta) * 100.0
        else:
            idle_pct = 100

        percentages[cpu] = idle_pct
    return percentages


def get_cpu_idle_percentages(interval=1.0):
    try:
        before = read_all_cpu_stats()
        time.sleep(interval)
        after = read_all_cpu_stats()

        return calculate_idle_percent(before, after)
    except (OSError, ValueError, KeyError):
        return {}


def get_used_and_total_ram():
    try:
        result = subprocess.run(
            ["free", "-h"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        for line in result.stdout.splitlines():
            if "Mem:" in line:
                return line.split()[1:4]
    except (OSError, IndexError):
        return ["N/A", "N/A", "N/A"]


def get_used_and_total_disk():
    result = subprocess.run(
        ["df", "-h"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    omitted = [
        "tmpfs",
        "udev",
        "overlay",
        "shm",
        "snap",
        "cgroup",
        "mmcblk0p1",
        "Filesystem",
    ]
    disks = {}
    for line in result.stdout.splitlines():
        if any(x in line for x in omitted):
            continue
        name, size, used, available, percent, mount, *_ = line.split()
        disks[name] = {
            "size": size,
            "used": used,
            "available": available,
            "percent": percent,
            "mount": mount,
        }

    return disks


def reboot():
    subprocess.run(["reboot"])


def hardware_info():
    return {
        "uptime": get_uptime(),
        "temperature": get_temperature(),
        "cpu_idle_percentages": get_cpu_idle_percentages(),
        "ram": get_used_and_total_ram(),
        "disk": get_used_and_total_disk(),
    }
