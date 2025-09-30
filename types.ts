export type GZMTRLine = {
    lineColor: string;
    lineId: number;
    lineName: string;
    lineNameEn: string;
    lineShowCode: string;
};

export type GZMTRStation = {
    hcLines: GZMTRLine[];
    isHuanCheng: boolean;
    stationId: number;
    stationName: string;
    stationNameEn: string;
    stationShowCode: string;
};

export type GZMTRStationResult = {
    businessObject: (GZMTRLine & {
        orderNum: string;
        stations: ({
            orderNum: number;
        } & GZMTRStation)[];
    })[];
    success: boolean;
};

export type CRStationTrainsResult = {
    timestamp: number;
    status: number;
    data?: {
        trainNo: string;
        trainCode: string;
        stationName: string;
        stationCode: string;
        startStationName: string;
        startStationCode: string;
        endStationName: string;
        endStationCode: string;
        arriveTime: string;
        departTime: string;
    }[];
};

export type CRTrainStation = {
    station_name: string;
    station_no: string;
    station_train_code: string;
    arrive_day_str: string;
    arrive_day_diff: string;
    arrive_time: string;
    start_time: string;
    wz_num: string;
    running_time: string;
    train_class_name?: string;
    is_start?: string;
    service_type?: string;
    start_station_name?: string;
    end_station_name?: string;
    OT?: unknown[];
};

export type CRTrainResult = {
    status: boolean;
    httpstatus: number;
    data: {
        data: CRTrainStation[] | null;
    };
    messages: string[];
    validateMessages: string[];
    validateMessagesShowId: string;
};

export type TrainStop = {
    name: string;
    arrive: string;
    depart: string;
};

export type Train = {
    code: string;
    stops: TrainStop[];
};

export type StopInfo = {
    code: string;
    depart: string;
};
