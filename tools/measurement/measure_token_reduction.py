#!/usr/bin/env python3
"""
Token Reduction Measurement Script

Measures actual token reduction achieved by OpenMCP Pattern.
Compares baseline (full schema) vs OpenMCP (lazy loading).
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import tiktoken


class TokenMeasurement:
    """
    Token measurement for MCP protocol messages
    """

    def __init__(self, log_file: Path):
        """
        Initialize measurement from protocol log

        Args:
            log_file: Path to protocol_messages.jsonl
        """
        self.log_file = log_file
        self.encoding = tiktoken.get_encoding("cl100k_base")
        self.measurements: List[Dict[str, Any]] = []

    def count_tokens(self, text: str) -> int:
        """
        Count tokens using tiktoken

        Args:
            text: Text to count

        Returns:
            Token count
        """
        return len(self.encoding.encode(text))

    def count_message_tokens(self, message: Dict[str, Any]) -> int:
        """
        Count tokens in MCP message

        Args:
            message: MCP protocol message

        Returns:
            Token count
        """
        message_str = json.dumps(message)
        return self.count_tokens(message_str)

    def parse_log_file(self) -> List[Dict[str, Any]]:
        """
        Parse protocol log file

        Returns:
            List of log entries
        """
        entries = []
        with self.log_file.open("r") as f:
            for line in f:
                if line.strip():
                    entries.append(json.loads(line))
        return entries

    def measure_initialize_phase(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Measure initialize phase token usage

        Args:
            entries: Log entries

        Returns:
            Measurement data
        """
        initialize_entries = [
            e for e in entries
            if e.get("metadata", {}).get("phase") == "initialize"
        ]

        if not initialize_entries:
            return {"phase": "initialize", "tokens": 0, "count": 0}

        total_tokens = sum(
            self.count_message_tokens(e["message"])
            for e in initialize_entries
        )

        return {
            "phase": "initialize",
            "tokens": total_tokens,
            "count": len(initialize_entries),
            "messages": [e["message"].get("method") for e in initialize_entries]
        }

    def measure_tools_list_phase(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Measure tools/list phase token usage

        Args:
            entries: Log entries

        Returns:
            Measurement data
        """
        tools_list_entries = [
            e for e in entries
            if e.get("metadata", {}).get("phase") == "tools_list"
        ]

        if not tools_list_entries:
            return {"phase": "tools_list", "tokens": 0, "count": 0}

        # Count request and response separately
        request_entries = [e for e in tools_list_entries if e["direction"] == "client→server"]
        response_entries = [e for e in tools_list_entries if e["direction"] == "server→client"]

        request_tokens = sum(
            self.count_message_tokens(e["message"])
            for e in request_entries
        )

        response_tokens = sum(
            self.count_message_tokens(e["message"])
            for e in response_entries
        )

        # Analyze tool count
        tool_count = 0
        if response_entries:
            last_response = response_entries[-1]["message"]
            if "result" in last_response and "tools" in last_response["result"]:
                tool_count = len(last_response["result"]["tools"])

        return {
            "phase": "tools_list",
            "request_tokens": request_tokens,
            "response_tokens": response_tokens,
            "total_tokens": request_tokens + response_tokens,
            "count": len(tools_list_entries),
            "tool_count": tool_count
        }

    def measure_expand_schema_phase(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Measure expandSchema phase token usage

        Args:
            entries: Log entries

        Returns:
            Measurement data
        """
        expand_entries = [
            e for e in entries
            if e.get("metadata", {}).get("phase") == "expand_schema"
        ]

        if not expand_entries:
            return {"phase": "expand_schema", "tokens": 0, "count": 0, "calls": []}

        # Group by tool_name
        calls_by_tool: Dict[str, List[Dict]] = {}
        for e in expand_entries:
            tool_name = e.get("metadata", {}).get("tool_name", "unknown")
            if tool_name not in calls_by_tool:
                calls_by_tool[tool_name] = []
            calls_by_tool[tool_name].append(e)

        calls = []
        total_tokens = 0

        for tool_name, tool_entries in calls_by_tool.items():
            call_tokens = sum(
                self.count_message_tokens(e["message"])
                for e in tool_entries
            )
            total_tokens += call_tokens

            calls.append({
                "tool_name": tool_name,
                "tokens": call_tokens,
                "call_count": len(tool_entries) // 2  # request + response
            })

        return {
            "phase": "expand_schema",
            "total_tokens": total_tokens,
            "count": len(expand_entries),
            "calls": calls
        }

    def measure_all(self) -> Dict[str, Any]:
        """
        Measure all phases

        Returns:
            Complete measurement data
        """
        entries = self.parse_log_file()

        initialize = self.measure_initialize_phase(entries)
        tools_list = self.measure_tools_list_phase(entries)
        expand_schema = self.measure_expand_schema_phase(entries)

        total_tokens = (
            initialize.get("tokens", 0) +
            tools_list.get("total_tokens", 0) +
            expand_schema.get("total_tokens", 0)
        )

        return {
            "timestamp": datetime.now().isoformat(),
            "log_file": str(self.log_file),
            "entry_count": len(entries),
            "phases": {
                "initialize": initialize,
                "tools_list": tools_list,
                "expand_schema": expand_schema
            },
            "total_tokens": total_tokens
        }

    def save_measurement(self, output_file: Path):
        """
        Save measurement to file

        Args:
            output_file: Output file path
        """
        measurement = self.measure_all()

        output_file.parent.mkdir(parents=True, exist_ok=True)
        with output_file.open("w") as f:
            json.dump(measurement, f, indent=2)

        print(f"✅ Measurement saved to: {output_file}")
        return measurement


def generate_report(measurement: Dict[str, Any]) -> str:
    """
    Generate human-readable Markdown report

    Args:
        measurement: Measurement data

    Returns:
        Markdown report
    """
    phases = measurement["phases"]
    init = phases["initialize"]
    tools_list = phases["tools_list"]
    expand = phases["expand_schema"]

    report = f"""# Token Reduction Measurement Report

**Date**: {measurement["timestamp"]}
**Log File**: {measurement["log_file"]}
**Total Entries**: {measurement["entry_count"]}

---

## Summary

| Phase | Tokens | Count |
|-------|--------|-------|
| **Initialize** | {init.get("tokens", 0):,} | {init.get("count", 0)} |
| **tools/list** | {tools_list.get("total_tokens", 0):,} | {tools_list.get("count", 0)} |
| **expandSchema** | {expand.get("total_tokens", 0):,} | {expand.get("count", 0)} |
| **TOTAL** | **{measurement["total_tokens"]:,}** | - |

---

## Phase Details

### 1. Initialize Phase
- **Tokens**: {init.get("tokens", 0):,}
- **Messages**: {init.get("count", 0)}
- **Methods**: {", ".join(init.get("messages", []))}

### 2. tools/list Phase
- **Request Tokens**: {tools_list.get("request_tokens", 0):,}
- **Response Tokens**: {tools_list.get("response_tokens", 0):,}
- **Total Tokens**: {tools_list.get("total_tokens", 0):,}
- **Tool Count**: {tools_list.get("tool_count", 0)}

### 3. expandSchema Phase
- **Total Tokens**: {expand.get("total_tokens", 0):,}
- **Calls**: {len(expand.get("calls", []))}

"""

    if expand.get("calls"):
        report += "\n#### expandSchema Calls by Tool\n\n"
        report += "| Tool | Tokens | Call Count |\n"
        report += "|------|--------|------------|\n"
        for call in expand["calls"]:
            report += f"| {call['tool_name']} | {call['tokens']:,} | {call['call_count']} |\n"

    report += "\n---\n\n"
    report += f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"

    return report


def main():
    """
    Main execution
    """
    # Default paths
    log_file = Path("apps/api/logs/protocol_messages.jsonl")
    output_file = Path("metrics/token_measurement.json")
    report_file = Path("docs/research/token_measurement_report.md")

    # Check if log file exists
    if not log_file.exists():
        print(f"❌ Error: Log file not found: {log_file}")
        print("\nPlease ensure:")
        print("1. Gateway is running: make up")
        print("2. Claude Desktop/Code is connected")
        print("3. Some MCP operations have been performed")
        sys.exit(1)

    # Measure
    print(f"📊 Measuring tokens from: {log_file}")
    measurer = TokenMeasurement(log_file)
    measurement = measurer.save_measurement(output_file)

    # Generate report
    report = generate_report(measurement)
    report_file.parent.mkdir(parents=True, exist_ok=True)
    with report_file.open("w") as f:
        f.write(report)

    print(f"📄 Report saved to: {report_file}")
    print("\n" + "="*60)
    print(report)
    print("="*60)


if __name__ == "__main__":
    main()
