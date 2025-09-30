import type { GZMTRStationResult, CRStationTrainsResult, CRTrainResult, Train, StopInfo, TrainStop } from './types.ts';

async function fetchStationCodeMap(): Promise<Map<string, string>> {
    const stationCodeMap = new Map<string, string>();
    const stationCodeResponse = await (await fetch('https://kyfw.12306.cn/otn/resources/js/framework/station_name.js')).text();
    const stationList = stationCodeResponse
        .match(/(?<=').+(?=')/)![0]
        .split('@')
        .slice(1);

    stationList.forEach((station) => {
        const details = station.split('|');
        stationCodeMap.set(details[1], details[2]);
    });

    return stationCodeMap;
}

async function fetchIntercityStations(): Promise<string[]> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const stationResult: GZMTRStationResult = await (
            await fetch('https://apis.gzmtr.com/app-map/metroweb/linestation', {
                method: 'POST',
                body: 'true',
                signal: controller.signal,
            })
        ).json();
        clearTimeout(timeout);

        const stationNames: string[] = [
            ...new Set(
                stationResult.businessObject
                    .filter((line) => /^CJ\d+$/.test(line.lineShowCode))
                    .flatMap((line) => line.stations)
                    .map((station) => station.stationName.replace('（城际）', ''))
            ),
        ];

        if (!stationNames.length) {
            throw new Error('未成功获取到站点信息');
        }

        return stationNames;
    } catch {
        return [
            '清城',
            '龙塘镇',
            '银盏',
            '狮岭',
            '乐同',
            '花都',
            '燕湖',
            '洲心',
            '飞霞',
            '花都',
            '花城街',
            '花山镇',
            '白云机场北',
            '番禺',
            '白云机场南',
            '白云机场东',
            '竹料',
            '帽峰山',
            '大源',
            '龙洞',
            '岑村',
            '科韵路',
            '琶洲',
            '广州大学城',
            '大石东',
            '佛山西',
            '狮山',
            '狮山北',
            '三水北',
            '云东海',
            '肇庆',
            '端州',
            '鼎湖山',
            '鼎湖东',
            '四会',
            '大旺',
            '顺德北',
            '北滘西',
            '番禺',
            '陈村',
            '张槎',
            '松山湖北',
            '大朗镇',
            '常平南',
            '常平东',
            '樟木头东',
            '银瓶',
            '沥林北',
            '广州长隆',
            '东环',
            '广州莲花山',
            '官桥北',
            '麻涌',
            '东莞西',
            '道滘',
            '西平西',
            '东城南',
            '寮步',
            '陈江南',
            '惠环',
            '龙丰',
            '西湖东',
            '云山',
            '小金口',
            '番禺',
            '惠州北',
            '广州莲花山',
            '琶洲',
            '深井',
            '化龙南',
        ];
    }
}

function processStationNames(stationNames: string[]): string[] {
    return stationNames.map((stationName) => {
        if (['肇庆', '佛山西', '东莞西', '惠州北'].includes(stationName)) {
            return stationName.slice(0, -1) + '  ' + stationName.slice(-1);
        }
        return stationName;
    });
}

function generateTrainCode(trainData: { station_train_code: string }[]): string {
    return trainData.reduce(
        (data, station) => {
            if (data.last != station.station_train_code) {
                let i = 0;
                while (data.last[i] == station.station_train_code[i]) {
                    i++;
                }
                data.str += data.str ? '/' : '';
                data.str += station.station_train_code.slice(i);
                data.last = station.station_train_code;
            }
            return data;
        },
        { last: '', str: '' }
    ).str;
}

function saveDataToFiles(dateCompactStr: string, trainData: Map<string, Train>, stationData: Map<string, StopInfo[]>) {
    const encoder = new TextEncoder();
    const dir = `data/${dateCompactStr}`;
    Deno.mkdirSync(dir, { recursive: true });
    Deno.writeFile(`${dir}/trains.json`, encoder.encode(JSON.stringify(Object.fromEntries(trainData))));
    Deno.writeFile(`${dir}/stations.json`, encoder.encode(JSON.stringify(Object.fromEntries(stationData))));
    Deno.writeFile(`${dir}/trains.map.json`, encoder.encode(JSON.stringify(Array.from(trainData))));
    Deno.writeFile(`${dir}/stations.map.json`, encoder.encode(JSON.stringify(Array.from(stationData))));
}

export async function fetchTrainData(targetDate?: string) {
    const date = targetDate ? Temporal.PlainDate.from(targetDate) : Temporal.Now.plainDateISO();
    const dateStr = date.toString();
    const dateCompactStr = dateStr.replace(/-/g, '');

    const stationCodeMap = await fetchStationCodeMap();

    const stationNames = await fetchIntercityStations();
    const stationNamesProcessed = processStationNames(stationNames);

    const checkedTrains = new Set<string>();
    const trainData = new Map<string, Train>();
    const stationData = new Map<string, StopInfo[]>();

    for (const stationName of stationNames) {
        console.log(`请求 ${stationName}站`);
        const stationCode = stationCodeMap.get(stationName);
        const stationTrainsResult: CRStationTrainsResult = await (
            await fetch(`https://wifi.12306.cn/wifiapps/ticket/api/stoptime/queryByStationCodeAndDate?stationCode=${stationCode}&trainDate=${dateCompactStr}`)
        ).json();
        if (!stationTrainsResult.data) {
            console.warn(`车站 ${stationName} 获取失败`);
            continue;
        }
        for (const train of stationTrainsResult.data) {
            if (checkedTrains.has(train.trainNo)) {
                continue;
            }
            checkedTrains.add(train.trainNo);

            console.log(`请求 ${train.trainCode}`);
            const trainDetail: CRTrainResult = await (
                await fetch(
                    `https://kyfw.12306.cn/otn/queryTrainInfo/query?leftTicketDTO.train_no=${train.trainNo}&leftTicketDTO.train_date=${dateStr}&rand_code=`
                )
            ).json();
            if (!trainDetail.data.data) {
                console.warn(`车次 ${train.trainCode} 无数据`);
                continue;
            }
            if (!stationNamesProcessed.includes(train.startStationName) || !stationNamesProcessed.includes(train.endStationName)) {
                console.log(`车次 ${train.trainCode} 非广东城际车次，跳过`);
                continue;
            }

            const stops: TrainStop[] = trainDetail.data.data.map((station) => ({
                name: station.station_name.replaceAll(' ', ''),
                arrive: Temporal.PlainTime.from(station.is_start ? station.start_time : station.arrive_time),
                depart: Temporal.PlainTime.from(station.start_time),
            }));
            const code = generateTrainCode(trainDetail.data.data);

            stops.forEach((station) => {
                if (!stationData.has(station.name)) {
                    stationData.set(station.name, []);
                }
                stationData.get(station.name)!.push({ code, depart: station.depart });
            });
            trainData.set(code, { code, stops });
            console.log(`添加 ${code}`);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    saveDataToFiles(dateCompactStr, trainData, stationData);
    console.log(`完成日期 ${dateStr} 的数据获取`);

    return {
        date: dateStr,
        trainCount: trainData.size,
        stationCount: stationData.size,
    };
}

if (import.meta.main) {
    const targetDate = Deno.args[0];
    await fetchTrainData(targetDate);
    console.log('全部完成');
}
