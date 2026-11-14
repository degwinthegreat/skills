#!/usr/bin/env ruby
# evals/<ケース>/prompt.tmpl.md の {{名前}} を names.env の値で置き換えて、prompt.md を書く。
# あわせて、prompt.md と graders/*.md の frontmatter を、claude plugin eval の文書にあるキーと照らす。
# 評価は走らせない。
#   ruby evals/build.rb          作り直して確かめる
#   ruby evals/build.rb --check  作り直さず、prompt.md が最新かと形だけを確かめる（差分があれば exit 1）
require "yaml"

DIR = __dir__
CHECK = ARGV.include?("--check")

# https://code.claude.com/docs/en/plugin-evals.md の prompt.md の欄と grader の種類（2026-11-14 に確かめた）
PROMPT_KEYS = %w[schema_version name description tags plugins runs expected_outcome model
                 max_turns timeout_seconds allowed_tools append_system_prompt env]
READ_ONLY_TOOLS = %w[Read Glob Grep Skill]
GRADER_KEYS = {
  "regex" => %w[pattern flags match target],
  "tool_used" => %w[tool input_match min max],
  "tool_order" => %w[before after],
  "file_exists" => %w[path exists],
  "llm" => %w[criteria focus],
  "baseline" => %w[baseline_file criteria],
}
COMMON_GRADER_KEYS = %w[type weight arm]

errors = []

names = File.readlines(File.join(DIR, "names.env"), chomp: true)
  .reject { |l| l.strip.empty? || l.start_with?("#") }
  .to_h { |l| l.split("=", 2) }

def split_front(text)
  m = text.match(/\A---\n(.*?)\n---\n(.*)\z/m) or return [nil, text]
  [YAML.safe_load(m[1]) || {}, m[2]]
end

templates = Dir.glob(File.join(DIR, "*/prompt.tmpl.md")).sort
errors << "ケースが見つからない" if templates.empty?

templates.each do |tmpl|
  case_dir = File.dirname(tmpl)
  name = File.basename(case_dir)
  src = File.read(tmpl)
  rendered = src.gsub(/\{\{(\w+)\}\}/) do
    names.fetch($1) { errors << "#{name}: names.env に無い名前 #{$1}"; $& }
  end
  out = File.join(case_dir, "prompt.md")
  if CHECK
    current = File.exist?(out) ? File.read(out) : nil
    errors << "#{name}: prompt.md が古い（ruby evals/build.rb で作り直す）" if current != rendered
  else
    File.write(out, rendered)
  end

  front, body = split_front(rendered)
  if front.nil?
    errors << "#{name}: prompt.md に frontmatter が無い"
  else
    (front.keys - PROMPT_KEYS).each { |k| errors << "#{name}: prompt.md の知らないキー #{k}" }
    (Array(front["allowed_tools"]) - READ_ONLY_TOOLS).each do |t|
      errors << "#{name}: allowed_tools に読むだけでない道具 #{t}（走らせるときに --allow-tools で渡す）"
    end
  end
  errors << "#{name}: プロンプトの本文が空" if body.strip.empty?

  graders = Dir.glob(File.join(case_dir, "graders/*.md")).sort
  errors << "#{name}: 採点役が無い" if graders.empty?
  graders.each do |g|
    gname = "#{name}/#{File.basename(g)}"
    gf, gbody = split_front(File.read(g))
    if gf.nil? || !GRADER_KEYS.key?(gf["type"])
      errors << "#{gname}: type が無いか、知らない type"
      next
    end
    (gf.keys - COMMON_GRADER_KEYS - GRADER_KEYS[gf["type"]]).each { |k| errors << "#{gname}: 知らないキー #{k}" }
    if gf["type"] == "tool_used" && gf["tool"].to_s == "Skill"
      errors << "#{gname}: tool_used: Skill は使わない（スラッシュの展開で呼ぶので Skill ツールは呼ばれない）"
    end
    if gf["type"] == "regex"
      begin
        Regexp.new(gf["pattern"].to_s)
      rescue RegexpError => e
        errors << "#{gname}: 正規表現が読めない（#{e.message}）"
      end
    end
    errors << "#{gname}: llm の採点の基準が空" if gf["type"] == "llm" && gbody.strip.empty? && gf["criteria"].to_s.empty?
  end
  # 採点役にスキルの名前を書かない（名前を変えても同じケースで比べるため）
  (graders + [tmpl]).each do |f|
    text = File.read(f)
    text = split_front(text)[1] if f == tmpl
    names.each_value do |v|
      short = v.split(":").last
      errors << "#{name}/#{File.basename(f)}: スキルの名前 #{short} をじかに書いている" if text.include?(short)
    end
  end
end

if errors.empty?
  puts "#{templates.size} ケース：形は合っている#{CHECK ? '（prompt.md は最新）' : '（prompt.md を作り直した）'}"
else
  warn errors.join("\n")
  exit 1
end
