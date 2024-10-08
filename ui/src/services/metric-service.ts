import { axiosInstance } from "../auth";
import { SeriesOptionsType } from 'highcharts';
import { baseUrl } from '../lib/utils.ts';

import { chatbotService } from './chatbot-service';


export type SeriesData = SeriesOptionsType & {
  type: string;
  name: string;
  data: number[][];
};


async function seriesFromData(test_data: any[] = []): Promise<any> {
  const scoreNames = await fetchScoreNames()

  const series: SeriesData[] = scoreNames.map((name: string) => ({
    type: 'line',
    name: name,
    data: []
  }));

  if (!test_data) {
    return series;
  }

  test_data.forEach((entry: any) => {
    const time_ms = new Date(entry.time).getTime();
    scoreNames.forEach((name: string, index: number) => {
      series[index].data.push([time_ms, entry[name]]);
    });
  });
  return series;
}

async function fetchChatbotMetrics(chatbotName: string | null) {

  const chatbots = await chatbotService.fetchChatbots()

  const chatbot = chatbots.find((chatbot: any) => chatbot.name === chatbotName); // change any later
  if (!chatbot) {
    return seriesFromData();
  }

  const response = await axiosInstance.get(`${baseUrl()}/api/history`);
  let data = response.data

  data = data.filter((entry: any) => entry.chatbot_id === chatbot.id);

  return seriesFromData(data);
}

async function fetchScoreNames() {
  const response = await axiosInstance.get(`${baseUrl()}/api/scores`);
  console.log('SCORE NAMES ARE:', response.data)
  return response.data;
}

export const metricService = {
  fetchChatbotMetrics,
  fetchScoreNames
};
