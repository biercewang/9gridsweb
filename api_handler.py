# api_handler.py
import zhipuai
import os
from flask import jsonify
import re
from openai import OpenAI

class APIHandler:
    def __init__(self):
        zhipuai.api_key = os.getenv('ZHIPU_APIKEY')   # 设定智谱AI的API密钥
        self.client = OpenAI(api_key=os.getenv("OPENAI_APIKEY"),
        )

        # 定义模板字典
        self.templates = {
            'default': """
                你是一位博学家 知识图谱专家,精通各个专业领域.我会给你提供的主题词.
                如果是一个主题词,请你把这个主题词拓展为为3-5个要点,最多不超过9个.
                
                比如在营销中常常提到的4P原则,当我说:
                "营销4P原则"

                你会直接按照以下格式回复我:

                价格：你对价格的详细描述
                产品：你对产品的详细描述
                渠道：你对渠道的详细描述
                营销：你对营销的详细描述

                请直接从要点的第一项开始,不要重复我提出的问题,也不要在开头进行说明.
                每个要点说完要换行,换行时请使用两个换行符,而不是一个
                请不要在每一点的前面增加序号如1. 2.
                不需要进行总结
                请不要在"："前写任何英文对照或翻译,如果写请写在"："之后
                每一个要点请先使用专业并广泛接受的定义解释.再使用比较通俗的语言解释.

                接下来要我说的一个主题词或者一段描述是:
                "{term}"
                """,

            'organize': """
                你是一位知识图谱的高手,精通各个专业领域.我会给你提供一段描述.
                请你把这段描述精炼为3-5个要点,最多不超过9个.

                请去掉这段描述开头所有有关的概括性的描述,只写各个关键点.
                请100%完全保留原有的说法,不要缩写或者改写
                请按照以下格式输出,
                比如:
                XX：对XX的原文描述
                XX：对XX的原文描述
                XX：对XX的原文描述
                XX：对XX的原文描述
                ....

                请直接从要点的第一项开始,不要重复我提出的问题,也不要在开头进行说明.
                每个要点说完要换行,换行时请使用两个换行符,而不是一个
                请不要在每一点的前面增加序号如1. 2.
                不需要进行总结

                接下来要我说的一个主题词或者一段描述是:
                "{term}"
                """
            # 可以在这里添加更多模板
        }

    def fetch_data_zhipu(self, term, prompt_type='default'):
        print("Prompt type received:", prompt_type)  # 监测使用的模板
        prompt_template = self.templates.get(prompt_type) or self.templates['default']
        prompt = prompt_template.format(term=term)
        try:
            response = zhipuai.model_api.invoke(
                model="chatglm_turbo",
                prompt=prompt,
                top_p=0.7,
                temperature=0.95,
            )
            # 处理并返回响应数据
            print(response)  #监测返回值是否准确

            # 提取内容
            content = response.get('data', {}).get('choices', [{}])[0].get('content', '')

            #清理格式
            content = content.strip(' "\'')  # 删除开头和结尾的空白字符及引号
            content = content.replace('\\n\\n', '\n').replace('\\n', '\n').replace('\xa0 ', '')  # 删除多余的换行和空格
            content = re.sub(r'\n\d+\.\s+|\n\s+', '\n', content)    #清除序号

            return jsonify({'content': content})  #返回json格式的文本
        
        except Exception as e:
            raise e  # 抛出异常以供上层处理
        
    #智谱的流式查询
    def fetch_data_zhipu_sse(self, term, prompt_type='default'):
        print("Prompt type received:", prompt_type)  # 监测使用的模板
        prompt_template = self.templates.get(prompt_type) or self.templates['default']
        prompt = prompt_template.format(term=term)

        try:
            response = zhipuai.model_api.sse_invoke(
                model="chatglm_turbo",
                prompt=[{"role": "user", "content": prompt}],
                top_p=0.7,
                temperature=0.9,
            )
            return self.stream_with_context(response)  # 返回响应对象供路由处理
        except Exception as e:
            raise e  # 抛出异常以供上层处理

    def stream_with_context(self, response):
        """处理流式数据并按格式输出"""
        for event in response.events():
            if event.event == "add":
                # 清理并发送数据块
                content = self.clean_content(event.data)
                print(content)
                yield content
            elif event.event in ["error", "interrupted"]:
                # 发送错误信息并中断
                yield content
                break
            elif event.event == "finish":
                # 发送最终数据并结束
                content = self.clean_content(event.data)
                yield content
                break
            else:
                # 处理其他情况
                yield content

    def clean_content(self, content):
        """清理内容的辅助函数"""
        content = content.strip(' "\'')  # 删除开头和结尾的空白字符及引号
        content = content.replace('\\n\\n', '\n').replace('\\n', '\n').replace('\xa0 ', '')  # 删除多余的换行和空格
        content = re.sub(r'\n\d+\.\s+|\n\s+', '\n', content)  # 清除序号
        return content

    def fetch_data_openai(self, term, prompt_type='default'):
        print("Prompt type received:", prompt_type)  # 监测使用的模板
        prompt_template = self.templates.get(prompt_type) or self.templates['default']
        prompt = prompt_template.format(term=term)
        try:
            # 创建聊天模型的完成请求
            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,

                    }
                ],
                model="gpt-4-1106-preview",
                top_p=0.7,
                temperature=0.95,
            )


            # 处理并返回响应数据
            print(response)  #监测返回值是否准确
            
            # 提取内容
            content = response.choices[0].message.content.strip()

            #清理格式
            content = content.strip(' "\'')  # 删除开头和结尾的空白字符及引号
            content = content.replace('\\n\\n', '\n').replace('\\n', '\n').replace('\xa0 ', '')  # 删除多余的换行和空格
            content = re.sub(r'\n\d+\.\s+|\n\s+', '\n', content)    #清除序号

            return jsonify({'content': content})
        except Exception as e:
            raise e
        
    def fetch_data_openai_sse(self, term, prompt_type='default'):
        print("Prompt type received:", prompt_type)  # 监测使用的模板
        prompt_template = self.templates.get(prompt_type) or self.templates['default']
        prompt = prompt_template.format(term=term)
        print(prompt)

        try:
            # 创建聊天模型的完成请求
            response = self.client.chat.completions.create(
                model="gpt-4-1106-preview",
                max_tokens=1000,
                temperature=0.95,
                n=1,
                stop=None,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,

                    }
                ],
                stream=True,
            )

            # 处理流式响应
            for chunk in response:
                content = chunk.choices[0].delta.content
                content = str(content)
                content = content.strip(' "\'')  # 删除开头和结尾的空白字符及引号
                content = content.replace('\\n\\n', '\n').replace('\\n', '\n').replace('\xa0 ', '')  # 删除多余的换行和空格
                content = re.sub(r'\n\d+\.\s+|\n\s+', '\n', content)    #清除序号
                if content == "None":
                    pass
                else:
                    yield content   
                print(content)

        except Exception as e:
            raise e

