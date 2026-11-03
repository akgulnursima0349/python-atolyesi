#!/bin/sh
# Veritabanı testlerini yerel Postgres 16'da çalıştırır (Supabase'in auth şeması taklit edilir).
D=/var/tmp/atolye-pg; P="psql -h $D -p 5433 -U postgres -q"
$P -c "drop database if exists atolye" -c "create database atolye"
$P -d atolye -v ON_ERROR_STOP=1 -f "$(dirname "$0")/supabase_taklit.sql" -f "$(dirname "$0")/../../supabase/kurulum.sql" 2>&1 | grep -v NOTICE
$P -d atolye -f "$(dirname "$0")/senaryo.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
