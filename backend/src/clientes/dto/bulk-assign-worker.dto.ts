export class BulkAssignWorkerItemDto {
  cliente_id: string;
  inmueble_id: string;
}

export class BulkAssignWorkerDto {
  worker_id: string;
  assignments: BulkAssignWorkerItemDto[];
}
