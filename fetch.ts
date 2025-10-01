import { fetchTrainData } from './index.ts';

function checkDataExists(dateStr: string): boolean {
    const dateCompactStr = dateStr.replace(/-/g, '');
    const dir = `data/${dateCompactStr}`;

    try {
        const stat = Deno.statSync(dir);
        if (stat.isDirectory) {
            const requiredFiles = ['trains.json', 'stations.json', 'trains.map.json', 'stations.map.json'];
            return requiredFiles.every((file) => {
                const fileStat = Deno.statSync(`${dir}/${file}`);
                return fileStat.isFile && fileStat.size > 0;
            });
        }
        return false;
    } catch {
        return false;
    }
}

function getDateString(daysOffset: number): string {
    const today = Temporal.Now.zonedDateTimeISO('Asia/Shanghai');
    const targetDate = today.add({ days: daysOffset });
    return targetDate.toPlainDate().toString();
}

async function main() {
    console.log('开始获取广东城际列车数据...');
    const now = Temporal.Now.zonedDateTimeISO('Asia/Shanghai');
    console.log(`执行时间: ${now.toPlainDateTime().toString()}`);

    const results = [];

    for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
        const dateStr = getDateString(dayOffset);
        console.log(`\n检查日期: ${dateStr} (今天+${dayOffset}天)`);

        if (checkDataExists(dateStr)) {
            console.log(`✓ 日期 ${dateStr} 的数据已存在，跳过获取`);
            results.push({
                date: dateStr,
                status: 'cached',
                message: '使用缓存数据',
            });
        } else {
            console.log(`⬇ 开始获取日期 ${dateStr} 的数据...`);
            try {
                const result = await fetchTrainData(dateStr);
                console.log(`✓ 成功获取日期 ${dateStr} 的数据 - 列车: ${result.trainCount}, 站点: ${result.stationCount}`);
                results.push({
                    date: dateStr,
                    status: 'fetched',
                    message: `成功获取 ${result.trainCount} 列车, ${result.stationCount} 站点`,
                    trainCount: result.trainCount,
                    stationCount: result.stationCount,
                });

                if (dayOffset < 3) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`✗ 获取日期 ${dateStr} 的数据失败:`, errorMessage);
                results.push({
                    date: dateStr,
                    status: 'error',
                    message: `获取失败: ${errorMessage}`,
                });
            }
        }
    }

    console.log('\n=== 执行摘要 ===');
    let fetchedCount = 0;
    let cachedCount = 0;
    let errorCount = 0;

    for (const result of results) {
        console.log(`${result.date}: ${result.status} - ${result.message}`);
        if (result.status === 'fetched') fetchedCount++;
        else if (result.status === 'cached') cachedCount++;
        else if (result.status === 'error') errorCount++;
    }

    console.log(`\n总计: ${results.length} 天`);
    console.log(`新获取: ${fetchedCount} 天`);
    console.log(`使用缓存: ${cachedCount} 天`);
    console.log(`失败: ${errorCount} 天`);

    const summaryData = {
        executionTime: Temporal.Now.zonedDateTimeISO('Asia/Shanghai').toString(),
        results: results,
        summary: {
            total: results.length,
            fetched: fetchedCount,
            cached: cachedCount,
            errors: errorCount,
        },
    };

    const encoder = new TextEncoder();
    Deno.mkdir('data', { recursive: true });
    Deno.writeFileSync('data/log.json', encoder.encode(JSON.stringify(summaryData)));

    console.log('\n数据获取完成！');
    Deno.exit(0);
}

if (import.meta.main) {
    await main();
}
