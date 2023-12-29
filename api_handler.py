# api_handler.py
import zhipuai
import json
import os
import sys
import re


class APIHandler:
    def __init__(self):
        self.api_key = os.getenv('API_KEY')  # 从环境变量读取API密钥
        if self.api_key:
            zhipuai.api_key = self.api_key  # 设定智谱AI的API密钥


    def fetch_data(self, term):
        prompt = self.generate_prompt(term)
        try:
            response = zhipuai.model_api.invoke(
                model="chatglm_turbo",
                prompt=prompt,
                top_p=0.7,
                temperature=0.95,
            )
            # 处理并返回响应数据
            print(response)
            return response
        except Exception as e:
            raise e  # 抛出异常以供上层处理


    @staticmethod
    def generate_prompt(term):
        return f"""
        你是一位知识图谱的高手,精通各个专业领域.我会给你提供的主题词,或者一段描述.
        如果是一个主题词,请你把这个主题词拓展为为3-5个要点,最多不超过9个.
        如果是一段描述,请你把这段描述精炼为3-5个要点,最多不超过9个.
        
        比如在营销中常常提到的4P原则,当我说:
        "营销4P原则"

        你会直接按照以下格式回复我:

        价格:你对价格的详细描述
        产品:你对产品的详细描述
        渠道:你对渠道的详细描述
        营销:你对营销的详细描述

        请直接从要点的第一项开始,不要重复我提出的问题,也不要在开头进行说明.
        每个要点说完要换行,换行时请使用两个换行符,而不是一个
        请不要在每一点的前面增加序号如1. 2.
        不需要进行总结

        接下来要我说的一个主题词或者一段描述是:
        "{term}"
        """

    
