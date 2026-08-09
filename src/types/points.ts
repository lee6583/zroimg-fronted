type PointsFlow = {
  id: string;
  flowNo: string;
  sourceType: string;
  changeType: string;
  amount: number;
  beforePoints: number;
  afterPoints: number;
  remark: string;
  createdAt: string;
};

type PointsFlowPage = {
  total: number;
  pages: number;
  list: PointsFlow[];
};

type PointsFlowQuery = {
  page: number;
  pageSize: number;
};

export type { PointsFlow, PointsFlowPage, PointsFlowQuery };
