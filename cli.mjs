#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {inspect} from './inspect.mjs';
try {
  const [file,...extra]=process.argv.slice(2);
  if(!file||extra.length)throw Error('Usage: node cli.mjs typed-data.json');
  const bytes=await readFile(file);if(bytes.length>1_000_000)throw Error('Input exceeds 1 MB');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  console.log(JSON.stringify(inspect(JSON.parse(text)),null,2));
} catch(e){console.error(`Inspection failed: ${e.message}`);process.exitCode=1;}
