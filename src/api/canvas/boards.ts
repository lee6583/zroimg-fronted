import { request } from "@/utils/request";
import type {
  CanvasBoard,
  CanvasBoardDetail,
  CanvasConfig,
  CreateCanvasBoardRequest,
  RenameCanvasBoardRequest,
  SaveCanvasSceneRequest,
  SaveCanvasSceneResponse,
} from "@/types/canvas";

const boardsUrl = "/api/canvas/user/boards";

function boardUrl(id: string) {
  return `${boardsUrl}/${encodeURIComponent(id)}`;
}

function list() {
  return request<CanvasBoard[]>({ url: boardsUrl, method: "GET" });
}

function create(data: CreateCanvasBoardRequest) {
  return request<CanvasBoard>({ url: boardsUrl, method: "POST", data });
}

function fetch(id: string) {
  return request<CanvasBoardDetail>({ url: boardUrl(id), method: "GET" });
}

function saveScene(id: string, data: SaveCanvasSceneRequest) {
  return request<SaveCanvasSceneResponse>({
    url: `${boardUrl(id)}/scene`,
    method: "PUT",
    data,
  });
}

function rename(id: string, data: RenameCanvasBoardRequest) {
  return request<CanvasBoard>({ url: boardUrl(id), method: "PATCH", data });
}

function remove(id: string) {
  return request<null>({ url: boardUrl(id), method: "DELETE" });
}

function fetchConfig() {
  return request<CanvasConfig>({ url: "/api/canvas/user/config", method: "GET" });
}

export const canvasBoardsApi = {
  list,
  create,
  fetch,
  saveScene,
  rename,
  remove,
  fetchConfig,
};
