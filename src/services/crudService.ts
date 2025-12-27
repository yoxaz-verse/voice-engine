// src/services/crudService.ts
import { AllowedTable } from '../config/allowedTables';
import { supabase } from '../supabase';
import { buildSelect } from '../utils/buildSelectQuery';
import { runBeforeWrite } from './domain';
import { transformForWrite, transformForRead } from './fieldTransform';

export async function listRows(
  table: AllowedTable,
  filters: Record<string, any> = {}
) {
  const select = buildSelect(table);

  let query = supabase
    .from(table)
    .select(select);

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;
  if (error) throw error;

  console.log("data",data);
  
  return (data ?? []).map((row: Record<string, any>) =>
    transformForRead(table, row)
  );
}





export async function insertRow(
  table: AllowedTable,
  payload: Record<string, any>
) {

  payload = await runBeforeWrite(table, payload, 'create');
  const data = await transformForWrite(table, payload);

  console.log('[INSERT DATA]', table, data);

  const { error } = await supabase
    .from(table)
    .insert(data);

  if (error) throw error;
}


export async function updateRow(
  table: AllowedTable,
  id: string,
  payload: Record<string, any>
) {
  payload = await runBeforeWrite(table, payload, 'update');
  const data = await transformForWrite(table, payload);
  console.log('[Update DATA]', table, data);

  const { error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteRow(
  table: AllowedTable,
  id: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
}
