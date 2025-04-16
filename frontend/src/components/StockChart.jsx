import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, LineSeries, CandlestickSeries } from 'lightweight-charts';
import { SMA, EMA, RSI, MACD } from "technicalindicators";
import axios from "axios";

const StockChart = () => {
    const [symbol, setSymbol] = useState("");
    const [ohlc, setOhlc] = useState(null);
    const [intervalId, setIntervalId] = useState(null);
    const [resolution, setResolution] = useState("daily");
    const [marketOpen, setMarketOpen] = useState(true);
    const [message, setMessage] = useState("");
    const [returns, setReturns] = useState({ dtd: 0, wtd: 0, mtd: 0, ytd: 0 });
    const [currentPrice, setCurrentPrice] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [userTime, setUserTime] = useState(new Date().toLocaleString());
    const [histData, setHistData] = useState([]);
    const [hoverData, setHoverData] = useState({
        ohlc: null,
        sma: null,
        ema: null,
        rsi: null,
        macd: null,
        time: null
    });
    const rsiDataRef = useRef([]);
const macdDataRef = useRef([]);
const [market, setMarket] = useState("US");


    
    

    const [smaPeriod, setSmaPeriod] = useState(14);
    const [emaPeriod, setEmaPeriod] = useState(14);
    const [indicators, setIndicators] = useState({ sma: true, ema: true, rsi: true, macd: true });

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleRef = useRef(null);
    const smaSeries = useRef(null);
    const emaSeries = useRef(null);
    const rsiChartRef = useRef(null);
    const macdChartRef = useRef(null);
    const rsiChart = useRef(null);
    const macdChart = useRef(null);
    const rsiSeries = useRef(null);
    const macdSeries = useRef(null);
    const rangeRef = useRef(null);

    const calculateReturn = (ref, current) => (!ref || ref === 0) ? 0 : ((current - ref) / ref) * 100;
    const formatReturn = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

    useEffect(() => {
        if (chartRef.current) return;

        // Main chart
        chartRef.current = createChart(chartContainerRef.current, {
            layout: { textColor: "black", background: { type: "solid", color: "white" } },
            grid: { vertLines: { visible: false }, horzLines: { visible: false } },
            timeScale: { timeVisible: true, secondsVisible: false },
            crosshair: { mode: CrosshairMode.Normal },
        });
        candleRef.current = chartRef.current.addSeries(CandlestickSeries);

        // RSI chart
        rsiChart.current = createChart(rsiChartRef.current, {
            layout: { textColor: "black", background: { type: "solid", color: "white" } },
            height: 100,
            timeScale: { timeVisible: true, secondsVisible: false },
            crosshair: { mode: CrosshairMode.Normal },
        });
        rsiSeries.current = rsiChart.current.addSeries(LineSeries);

        // MACD chart
        macdChart.current = createChart(macdChartRef.current, {
            layout: { textColor: "black", background: { type: "solid", color: "white" } },
            height: 100,
            timeScale: { timeVisible: true, secondsVisible: false },
            crosshair: { mode: CrosshairMode.Normal },
        });
        macdSeries.current = macdChart.current.addSeries(LineSeries);

        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (!range) return;
            rangeRef.current = { from: range.from, to: range.to };
            rsiChart.current.timeScale().setVisibleLogicalRange(range);
            macdChart.current.timeScale().setVisibleLogicalRange(range);
        });

        const getPoint = (series, param) => {
            if (!param.time) return null;
            return param.seriesData.get(series) || null;
        };
        const syncCrosshair = (chart, series, point) => {
            if (point) {
                chart.setCrosshairPosition(point.value, point.time, series);
            } else {
                chart.clearCrosshairPosition();
            }
        };

        chartRef.current.subscribeCrosshairMove(param => {
            if (!param.time || !param.seriesData) {
                setHoverData(prev => ({ ...prev, ohlc: null, time: null }));
                return;
            }
        
            const ohlcPoint = param.seriesData.get(candleRef.current);
            const smaPoint = smaSeries.current ? param.seriesData.get(smaSeries.current) : null;
            const emaPoint = emaSeries.current ? param.seriesData.get(emaSeries.current) : null;
            const rsiPoint = rsiDataRef.current.find(d => d.time === param.time);
            const macdPoint = macdDataRef.current.find(d => d.time === param.time);

            
            setHoverData({
                time: param.time,
                ohlc: ohlcPoint || null,
                sma: smaPoint ? smaPoint.value : null,
                ema: emaPoint ? emaPoint.value : null,
                rsi: rsiPoint ? rsiPoint.value : null,
                macd: macdPoint ? macdPoint.value : null
            });
        
            const point = ohlcPoint;
            syncCrosshair(rsiChart.current, rsiSeries.current, point);
            syncCrosshair(macdChart.current, macdSeries.current, point);
        });
        

        const timeUpdater = setInterval(() => {
            setUserTime(new Date().toLocaleString());
        }, 1000);

        return () => {
            chartRef.current?.remove();
            rsiChart.current?.remove();
            macdChart.current?.remove();
            clearInterval(timeUpdater);
        };
    }, []);

    const resetChart = () => {
        if (candleRef.current) {
            chartRef.current.removeSeries(candleRef.current);
            candleRef.current = null;
        }
        [smaSeries, emaSeries].forEach(ref => {
            if (ref.current) {
                chartRef.current.removeSeries(ref.current);
                ref.current = null;
            }
        });
        if (rsiSeries.current) {
            rsiChart.current.removeSeries(rsiSeries.current);
            rsiSeries.current = null;
        }
        if (macdSeries.current) {
            macdChart.current.removeSeries(macdSeries.current);
            macdSeries.current = null;
        }
    };

    
    const updateIndicators = (histData) => {
        if (!histData || !histData.length || !chartRef.current) return;
    
        const closeValues = histData.map(c => c.close);
    
        // 🔒 Save current view range before making changes
        const visibleRange = chartRef.current.timeScale().getVisibleLogicalRange();
    
        // --- SMA ---
        if (indicators.sma) {
            if (!smaSeries.current) {
                smaSeries.current = chartRef.current.addSeries(LineSeries, { color: "blue" });
            }
            const smaData = SMA.calculate({ values: closeValues, period: smaPeriod })
                .map((value, index) => ({ time: histData[index + (smaPeriod - 1)]?.time, value }));
            smaSeries.current.setData(smaData);
        } else if (smaSeries.current) {
            chartRef.current.removeSeries(smaSeries.current);
            smaSeries.current = null;
        }
    
        // --- EMA ---
        if (indicators.ema) {
            if (!emaSeries.current) {
                emaSeries.current = chartRef.current.addSeries(LineSeries, { color: "red" });
            }
            const emaData = EMA.calculate({ values: closeValues, period: emaPeriod })
                .map((value, index) => ({ time: histData[index + (emaPeriod - 1)]?.time, value }));
            emaSeries.current.setData(emaData);
        } else if (emaSeries.current) {
            chartRef.current.removeSeries(emaSeries.current);
            emaSeries.current = null;
        }
    
        // --- RSI ---
        if (indicators.rsi) {
            if (!rsiSeries.current) {
                rsiSeries.current = rsiChart.current.addSeries(LineSeries, { color: "purple" });
            }
            const rsiData = RSI.calculate({ values: closeValues, period: 14 })
                .map((value, index) => ({ time: histData[index + 13]?.time, value }));
            rsiSeries.current.setData(rsiData);
            rsiDataRef.current = rsiData
        } else if (rsiSeries.current) {
            rsiChart.current.removeSeries(rsiSeries.current);
            rsiSeries.current = null;
        }
    
        // --- MACD ---
        // --- MACD ---
if (indicators.macd) {
    if (!macdSeries.current) {
        macdSeries.current = macdChart.current.addSeries(LineSeries, { color: "green" });
    }
    const macdData = MACD.calculate({
        values: closeValues,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    }).map((value, index) => ({ time: histData[index + 25]?.time, value: value.MACD }));
    
    macdSeries.current.setData(macdData);
    macdDataRef.current = macdData;
} else if (macdSeries.current) {
    macdChart.current.removeSeries(macdSeries.current);
    macdSeries.current = null;
    macdDataRef.current = [];
}

    
        // 🔁 Restore previous view range
        if (visibleRange) {
            chartRef.current.timeScale().setVisibleLogicalRange(visibleRange);
        }
    };
    

    const fetchData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/stock/${symbol}?resolution=${resolution}`);
            const data = res.data;

            setMarketOpen(data.market_open);
            setMessage(data.market_open ? '' : data.message || 'Market closed');

            const newCandle = {
                time: data.time,
                open: data.open,
                high: data.high,
                low: data.low,
                close: data.close
            };

            setOhlc(newCandle);
            setCurrentPrice(data.close);
            setReturns({
                dtd: calculateReturn(data.ref_dtd, data.close),
                wtd: calculateReturn(data.ref_wtd, data.close),
                mtd: calculateReturn(data.ref_mtd, data.close),
                ytd: calculateReturn(data.ref_ytd, data.close),
            });

            setLastUpdated(new Date(data.server_time * 1000).toLocaleString());

            if (!marketOpen || !candleRef.current) return;

            setHistData(prevHist => {
                const lastCandle = prevHist[prevHist.length - 1];
                let updatedHist;

                const lastCandleDate = new Date((lastCandle?.time || 0) * 1000).toDateString();
                const newCandleDate = new Date(newCandle.time * 1000).toDateString();

                if (lastCandleDate === newCandleDate) {
                    updatedHist = [...prevHist.slice(0, -1), newCandle];
                } else if (newCandle.time > (lastCandle?.time || 0)) {
                    updatedHist = [...prevHist, newCandle];
                } else {
                    return prevHist;
                }

                candleRef.current.setData(updatedHist);
                updateIndicators(updatedHist);

                return updatedHist;
            });

        } catch (err) {
            console.error('Fetch error:', err);
            setMessage('Failed to fetch data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!symbol.trim()) return;

        clearInterval(intervalId);

        try {
            const res = await axios.get(`http://localhost:5000/historical/${symbol}?resolution=${resolution}`);
            const fetchedHist = res.data;
            if (!chartRef.current || !fetchedHist.length) return;
            setHistData(fetchedHist);

            resetChart();

            candleRef.current = chartRef.current.addSeries(CandlestickSeries);
            candleRef.current.setData(fetchedHist);
            chartRef.current.timeScale().fitContent();

            updateIndicators(fetchedHist);

            fetchData();
            const id = setInterval(fetchData, 1000);
            setIntervalId(id);
        } catch (err) {
            console.error('Error loading data:', err);
            setMessage('Failed to load stock data');
        }
    };

    useEffect(() => {
        if (symbol.trim()) handleSubmit(new Event("submit"));
    }, [indicators, smaPeriod, emaPeriod]);

    return (
        <div style={{ width: '80%', margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Enter stock symbol"
                    style={{ padding: '10px', margin: '0 10px', fontSize: '14px' }}
                />
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={{ padding: '10px', margin: '0 10px', fontSize: '14px' }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                    Load Chart
                </button>
            </form>
    
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <input
                        type="checkbox"
                        checked={indicators.sma}
                        onChange={() => setIndicators(prev => ({ ...prev, sma: !prev.sma }))}
                        style={{ marginRight: '10px' }}
                    /> SMA
                    <input
                        type="number"
                        value={smaPeriod}
                        onChange={(e) => setSmaPeriod(Number(e.target.value))}
                        min="1"
                        disabled={!indicators.sma}
                        style={{ marginLeft: '10px', width: '60px' }}
                    />
                </label>
    
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <input
                        type="checkbox"
                        checked={indicators.ema}
                        onChange={() => setIndicators(prev => ({ ...prev, ema: !prev.ema }))}
                        style={{ marginRight: '10px' }}
                    /> EMA
                    <input
                        type="number"
                        value={emaPeriod}
                        onChange={(e) => setEmaPeriod(Number(e.target.value))}
                        min="1"
                        disabled={!indicators.ema}
                        style={{ marginLeft: '10px', width: '60px' }}
                    />
                </label>
    
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <input
                        type="checkbox"
                        checked={indicators.rsi}
                        onChange={() => setIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
                        style={{ marginRight: '10px' }}
                    /> RSI
                </label>
    
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <input
                        type="checkbox"
                        checked={indicators.macd}
                        onChange={() => setIndicators(prev => ({ ...prev, macd: !prev.macd }))}
                        style={{ marginRight: '10px' }}
                    /> MACD
                </label>
            </div>
    
            <div style={{ marginBottom: '20px', fontSize: '14px' }}>Your Local Time: {userTime}</div>
    
            {message && <div style={{ marginBottom: '20px', fontSize: '14px' }}>{message}</div>}
    
            {ohlc && (
  <>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '16px',
        marginBottom: '4px',
      }}
    >
      <div style={{ flex: 1 }}>Open: ${ohlc.open}</div>
      <div style={{ flex: 1 }}>High: ${ohlc.high}</div>
      <div style={{ flex: 1 }}>Low: ${ohlc.low}</div>
      <div style={{ flex: 1 }}>Close: ${ohlc.close}</div>
      <div style={{ flex: 1 }}>Updated: {lastUpdated}</div>
      <div style={{ flex: 1 }}>Current Price: ${currentPrice}</div>
    </div>

    {returns && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#aaa',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: 1 }}>
          <strong>Date:</strong> {returns.date}
        </div>
        <div style={{ flex: 1 }}>
          <strong>DTD:</strong> {returns.dtd}%
        </div>
        <div style={{ flex: 1 }}>
          <strong>WTD:</strong> {returns.wtd}%
        </div>
        <div style={{ flex: 1 }}>
          <strong>MTD:</strong> {returns.mtd}%
        </div>
        <div style={{ flex: 1 }}>
          <strong>YTD:</strong> {returns.ytd}%
        </div>
      </div>
    )}
  </>
)}

            {hoverData.ohlc && (
    <div style={{ marginBottom: '20px', fontSize: '14px' }}>
        <strong>Hovered Data ({new Date(hoverData.time * 1000).toLocaleString()}):</strong><br />
        OHLC - Open: ${hoverData.ohlc.open}, High: ${hoverData.ohlc.high}, Low: ${hoverData.ohlc.low}, Close: ${hoverData.ohlc.close}<br />
        {indicators.sma && hoverData.sma !== null && <>SMA: {hoverData.sma.toFixed(2)} | </>}
        {indicators.ema && hoverData.ema !== null && <>EMA: {hoverData.ema.toFixed(2)} | </>}
        {indicators.rsi && hoverData.rsi !== null && <>RSI: {hoverData.rsi.toFixed(2)} | </>}
        {indicators.macd && hoverData.macd !== null && <>MACD: {hoverData.macd.toFixed(2)}</>}
    </div>
)}

    
            <div ref={chartContainerRef} style={{ width: '100%', height: '400px', marginBottom: '20px' }} />
            <div ref={rsiChartRef} style={{ width: '100%', height: '150px', marginBottom: '20px' }} />
            <div ref={macdChartRef} style={{ width: '100%', height: '150px', marginBottom: '20px' }} />
        </div>
        
    );
    
};

export default StockChart;
