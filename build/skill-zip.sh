#!/usr/bin/env bash
# 把 SKILL 仓库打包成 public/skills/<name>.zip，供"智能体运维"下的页面下载。
# 只打包 SKILL 部分（SKILL.md、其它 md、scripts/、references/、framework/、themes/、配置示例），
# 不含仓库根目录下的 Erlang 应用部分（src/、ebin/、priv/、rebar.config 等），
# 也不含 env.ini、.env、.venv、devices/ 等本地凭证和运行产物。
# zip 内的目录名取 SKILL.md 头部的 name，解压后可直接放入智能体的 skills 目录。
#
# 用法：build/skill-zip.sh <SKILL 目录>...
#   不传参数时打包后端依赖里的全部 SKILL：
#   ../alinkiot/_build/default/lib/{erl_cli,skill_alinkiot_api,skill_alinkiot_app,skill_alinkiot_vdevice}
# SKILL 更新后重新执行本脚本并提交 public/skills/ 下的 zip。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/public/skills"
DEPS="$ROOT/../alinkiot/_build/default/lib"

if [ "$#" -eq 0 ]; then
  set -- "$DEPS/erl_cli" "$DEPS/skill_alinkiot_api" "$DEPS/skill_alinkiot_app" "$DEPS/skill_alinkiot_vdevice"
fi

# 以 / 开头的只匹配仓库根目录（Erlang 应用部分），SKILL 内部的 framework/src 等照常打包
EXCLUDES=(
  /_build /ebin /src /priv /include /c_src /test
  /rebar.config /rebar.lock /rebar3.crashdump /LICENSE
  .git .gitignore .DS_Store __pycache__ '*.pyc'
  env.ini .env .venv .pytest_cache /framework/var /devices
)

pack() {
  local src="$1"
  if [ ! -f "$src/SKILL.md" ]; then
    echo "不是 SKILL 目录（缺少 SKILL.md）：$src" >&2
    return 1
  fi
  src="$(cd "$src" && pwd)"
  local name
  name="$(sed -n '1,/^---$/{/^name:/{s/^name:[[:space:]]*//;s/[[:space:]]*$//;p;q;};}' "$src/SKILL.md" | head -1)"
  if [ -z "$name" ]; then
    echo "SKILL.md 头部没有 name：$src" >&2
    return 1
  fi

  local tmp args=()
  tmp="$(mktemp -d)"
  for e in "${EXCLUDES[@]}"; do args+=(--exclude "$e"); done
  rsync -a "${args[@]}" "$src/" "$tmp/$name/"

  mkdir -p "$OUT_DIR"
  local out="$OUT_DIR/${name}.zip"
  rm -f "$out"
  (cd "$tmp" && zip -qr -X "$out" "$name")
  rm -rf "$tmp"

  local rev
  rev="$(git -C "$src" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo "已生成 ${out}（来源 ${src}，版本 ${rev}）"
  unzip -l "$out" | sed -n '4,$p' | sed '$d' | sed '$d'
}

for dir in "$@"; do
  pack "$dir"
done
