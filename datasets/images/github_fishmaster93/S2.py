"""
奶牛基础信息统计分析
分析奶牛数量、月龄、胎次、乳腺炎分布等基础信息
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# 设置中文字体（删除这部分，改用默认字体）
# plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
# plt.rcParams['axes.unicode_minus'] = False

def load_and_prepare_data(file_path):
    """加载数据并进行基础处理"""
    print("="*60)
    print("📊 数据加载和预处理")
    print("="*60)

    # 加载数据
    if file_path.endswith('.xlsx'):
        df = pd.read_excel(file_path)
    else:
        try:
            df = pd.read_csv(file_path, encoding='gbk')
        except:
            df = pd.read_csv(file_path, encoding='utf-8')

    print(f"原始数据形状: {df.shape}")
    print(f"列名: {list(df.columns)}")

    # 列名翻译
    column_translation = {
        'ID': 'cow_id', 'id': 'cow_id', 'Id': 'cow_id',
        '胎次': 'parity', '月龄': 'month_age', '产奶量': 'milk_yield',
        '乳脂率': 'fat_percentage', '蛋白率': 'protein_percentage',
        '体细胞数': 'somatic_cell_count', '体细胞评分': 'somatic_cell_score',
        '产犊季节': 'calving_season', '检测季节': 'test_season',
        '泌乳天数': 'lactation_days', 'DIM': 'lactation_days',
        '高峰奶': 'peak_milk', '高峰日': 'peak_day',
        'X305奶量': 'X305_milk', '校正奶': 'corrected_milk'
    }

    df = df.rename(columns=column_translation)

    # 确保有cow_id列
    possible_id_cols = ['cow_id', 'ID', 'id', 'Id', '牛号', '耳号']
    id_col = None
    for col in possible_id_cols:
        if col in df.columns:
            id_col = col
            if col != 'cow_id':
                df['cow_id'] = df[col]
            break

    if id_col is None:
        print("❌ 未找到奶牛ID列，请检查数据")
        return None

    print(f"使用 {id_col} 作为奶牛ID列")

    # 定义乳腺炎标签
    if 'somatic_cell_score' in df.columns:
        df['mastitis'] = (df['somatic_cell_score'] >= 4).astype(int)
        print("基于体细胞评分创建乳腺炎标签 (阈值≥4)")
    elif 'somatic_cell_count' in df.columns:
        df['mastitis'] = (df['somatic_cell_count'] >= 200000).astype(int)
        print("基于体细胞数创建乳腺炎标签 (阈值≥200,000)")
    else:
        print("⚠️ 未找到体细胞相关列，无法创建乳腺炎标签")
        df['mastitis'] = 0

    return df

def analyze_cattle_basic_info(df):
    """分析奶牛基础信息"""
    print("\n" + "="*60)
    print("🐄 奶牛基础信息统计")
    print("="*60)

    # 基础统计
    total_records = len(df)
    unique_cattle = df['cow_id'].nunique()
    records_per_cow = total_records / unique_cattle

    print(f"总记录数: {total_records:,}")
    print(f"唯一奶牛数: {unique_cattle:,}")
    print(f"平均每头牛记录数: {records_per_cow:.1f}")

    # 记录数分布
    records_dist = df['cow_id'].value_counts()
    print(f"\n每头牛记录数分布:")
    print(f"最少记录数: {records_dist.min()}")
    print(f"最多记录数: {records_dist.max()}")
    print(f"中位数记录数: {records_dist.median()}")

    return {
        'total_records': total_records,
        'unique_cattle': unique_cattle,
        'records_per_cow': records_per_cow,
        'records_distribution': records_dist
    }

def analyze_age_distribution(df):
    """分析月龄分布"""
    print("\n" + "="*60)
    print("📅 月龄分布分析")
    print("="*60)

    if 'month_age' not in df.columns:
        print("❌ 未找到月龄列")
        return None

    # 按奶牛分组，取平均月龄
    cow_ages = df.groupby('cow_id')['month_age'].mean()

    print(f"月龄统计:")
    print(f"最小月龄: {cow_ages.min():.1f} 月")
    print(f"最大月龄: {cow_ages.max():.1f} 月")
    print(f"平均月龄: {cow_ages.mean():.1f} 月")
    print(f"中位数月龄: {cow_ages.median():.1f} 月")

    # 年龄分组
    age_groups = pd.cut(cow_ages,
                       bins=[0, 24, 36, 48, 60, 100],
                       labels=['<2y', '2-3y', '3-4y', '4-5y', '>5y'])

    age_group_counts = age_groups.value_counts()
    print(f"\n年龄分组统计:")
    for group, count in age_group_counts.items():
        pct = count / len(cow_ages) * 100
        print(f"{group}: {count} 头 ({pct:.1f}%)")

    return cow_ages, age_group_counts

def analyze_parity_distribution(df):
    """分析胎次分布"""
    print("\n" + "="*60)
    print("🤱 胎次分布分析")
    print("="*60)

    if 'parity' not in df.columns:
        print("❌ 未找到胎次列")
        return None

    # 按奶牛分组，取最大胎次（当前胎次）
    cow_parity = df.groupby('cow_id')['parity'].max()

    print(f"胎次统计:")
    print(f"最小胎次: {cow_parity.min()}")
    print(f"最大胎次: {cow_parity.max()}")
    print(f"平均胎次: {cow_parity.mean():.1f}")
    print(f"中位数胎次: {cow_parity.median()}")

    # 胎次分布
    parity_counts = cow_parity.value_counts().sort_index()
    print(f"\n各胎次奶牛数量:")
    for parity, count in parity_counts.items():
        pct = count / len(cow_parity) * 100
        print(f"第{parity}胎: {count} 头 ({pct:.1f}%)")

    return cow_parity, parity_counts

def analyze_mastitis_distribution(df):
    """分析乳腺炎分布"""
    print("\n" + "="*60)
    print("🩺 乳腺炎分布分析")
    print("="*60)

    if 'mastitis' not in df.columns:
        print("❌ 未找到乳腺炎标签")
        return None

    # 总体乳腺炎比例
    total_mastitis_rate = df['mastitis'].mean()
    print(f"总体乳腺炎检出率: {total_mastitis_rate:.1%}")

    # 按奶牛统计乳腺炎
    cow_mastitis = df.groupby('cow_id').agg({
        'mastitis': ['sum', 'count', 'mean']
    }).round(3)

    cow_mastitis.columns = ['mastitis_count', 'total_tests', 'mastitis_rate']

    print(f"\n每头牛乳腺炎统计:")
    print(f"平均检测次数: {cow_mastitis['total_tests'].mean():.1f}")
    print(f"平均乳腺炎次数: {cow_mastitis['mastitis_count'].mean():.1f}")
    print(f"平均乳腺炎比例: {cow_mastitis['mastitis_rate'].mean():.1%}")

    # 乳腺炎次数分布
    mastitis_count_dist = cow_mastitis['mastitis_count'].value_counts().sort_index()
    print(f"\n乳腺炎次数分布:")
    for count, cows in mastitis_count_dist.items():
        pct = cows / len(cow_mastitis) * 100
        print(f"{int(count)}次: {cows} 头 ({pct:.1f}%)")

    # 从未患病 vs 患过病的牛
    never_sick = (cow_mastitis['mastitis_count'] == 0).sum()
    ever_sick = (cow_mastitis['mastitis_count'] > 0).sum()

    print(f"\n健康状况分布:")
    print(f"从未患乳腺炎: {never_sick} 头 ({never_sick/len(cow_mastitis)*100:.1f}%)")
    print(f"患过乳腺炎: {ever_sick} 头 ({ever_sick/len(cow_mastitis)*100:.1f}%)")

    return cow_mastitis, mastitis_count_dist

def analyze_production_performance(df):
    """分析生产性能"""
    print("\n" + "="*60)
    print("🥛 生产性能分析")
    print("="*60)

    # 按奶牛分组，计算平均生产性能
    production_cols = ['milk_yield', 'fat_percentage', 'protein_percentage']
    available_cols = [col for col in production_cols if col in df.columns]

    if not available_cols:
        print("❌ 未找到生产性能相关列")
        return None

    cow_production = df.groupby('cow_id')[available_cols].mean()

    print(f"生产性能统计 (每头牛平均值):")
    for col in available_cols:
        values = cow_production[col].dropna()
        if len(values) > 0:
            print(f"{col}:")
            print(f"  平均值: {values.mean():.2f}")
            print(f"  中位数: {values.median():.2f}")
            print(f"  标准差: {values.std():.2f}")
            print(f"  范围: {values.min():.2f} - {values.max():.2f}")

    return cow_production

def create_visualizations(df, cow_ages=None, parity_counts=None, mastitis_data=None):
    """创建可视化图表"""
    print("\n" + "="*60)
    print("📊 生成可视化图表")
    print("="*60)

    # 设置图表样式
    plt.style.use('default')
    fig = plt.figure(figsize=(16, 12))

    # 1. 年龄分布直方图
    if cow_ages is not None:
        plt.subplot(2, 3, 1)
        plt.text(0.98, 0.98, '(a)', transform=plt.gca().transAxes, fontsize=14, fontweight='bold', va='top', ha='right')
        plt.hist(cow_ages, bins=20, alpha=0.7, color='skyblue', edgecolor='black')
        plt.xlabel('Age (months)')
        plt.ylabel('Number of Cows')
        plt.title('Cow Age Distribution')
        plt.grid(True, alpha=0.3)

    # 2. 胎次分布柱状图
    if parity_counts is not None:
        plt.subplot(2, 3, 2)
        plt.text(0.98, 0.98, '(b)', transform=plt.gca().transAxes, fontsize=14, fontweight='bold', va='top', ha='right')
        bars = plt.bar(parity_counts.index, parity_counts.values,
                      color='lightgreen', alpha=0.7, edgecolor='black')
        plt.xlabel('Parity')
        plt.ylabel('Number of Cows')
        plt.title('Cow Parity Distribution')
        plt.grid(True, alpha=0.3, axis='y')

        # 添加数值标签
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom')

    # 3. 乳腺炎次数分布
    if mastitis_data is not None:
        cow_mastitis, mastitis_count_dist = mastitis_data
        plt.subplot(2, 3, 3)
        plt.text(0.98, 0.98, '(c)', transform=plt.gca().transAxes, fontsize=14, fontweight='bold', va='top', ha='right')
        bars = plt.bar(mastitis_count_dist.index, mastitis_count_dist.values,
                      color='salmon', alpha=0.7, edgecolor='black')
        plt.xlabel('Mastitis Episodes')
        plt.ylabel('Number of Cows')
        plt.title('Mastitis Episodes Distribution')
        plt.grid(True, alpha=0.3, axis='y')

        # 添加数值标签
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom')

    # 4. 乳腺炎率分布
    if mastitis_data is not None:
        cow_mastitis, _ = mastitis_data
        plt.subplot(2, 3, 4)
        plt.text(0.98, 0.98, '(d)', transform=plt.gca().transAxes, fontsize=14, fontweight='bold', va='top', ha='right')
        plt.hist(cow_mastitis['mastitis_rate'], bins=20, alpha=0.7,
                color='orange', edgecolor='black')
        plt.xlabel('Mastitis Rate')
        plt.ylabel('Number of Cows')
        plt.title('Mastitis Rate Distribution')
        plt.grid(True, alpha=0.3)

    # 5. 检测次数分布
    if mastitis_data is not None:
        cow_mastitis, _ = mastitis_data
        plt.subplot(2, 3, 5)
        plt.text(0.98, 0.98, '(e)', transform=plt.gca().transAxes, fontsize=14, fontweight='bold', va='top', ha='right')
        test_counts = cow_mastitis['total_tests'].value_counts().sort_index()
        plt.bar(test_counts.index, test_counts.values,
               color='purple', alpha=0.7, edgecolor='black')
        plt.xlabel('Number of Tests')
        plt.ylabel('Number of Cows')
        plt.title('Tests per Cow Distribution')
        plt.grid(True, alpha=0.3, axis='y')

    # 6. 月龄 vs 胎次散点图
    if 'month_age' in df.columns and 'parity' in df.columns:
        plt.subplot(2, 3, 6)
        plt.text(0.98, 0.98, '(f)', transform=plt.gca().transAxes, fontsize=14, fontweight='bold', va='top', ha='right')
        cow_data = df.groupby('cow_id')[['month_age', 'parity']].mean()
        plt.scatter(cow_data['month_age'], cow_data['parity'],
                   alpha=0.6, color='brown', s=30)
        plt.xlabel('Age (months)')
        plt.ylabel('Parity')
        plt.title('Age vs Parity Relationship')
        plt.grid(True, alpha=0.3)

        # 添加趋势线
        z = np.polyfit(cow_data['month_age'].dropna(),
                      cow_data['parity'].dropna(), 1)
        p = np.poly1d(z)
        plt.plot(cow_data['month_age'], p(cow_data['month_age']),
                "r--", alpha=0.8, linewidth=2)

    plt.tight_layout()
    plt.savefig('cattle_basic_analysis.svg', format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print("📊 图表已保存至 cattle_basic_analysis.svg")

def save_detailed_summary(basic_info, cow_ages, parity_data, mastitis_data, production_data):
    """保存详细统计摘要"""
    print("\n" + "="*60)
    print("💾 保存详细统计报告")
    print("="*60)

    # 创建统计摘要
    summary = {
        '基础信息': {
            '总记录数': basic_info['total_records'],
            '唯一奶牛数': basic_info['unique_cattle'],
            '平均每头牛记录数': round(basic_info['records_per_cow'], 2)
        }
    }

    if cow_ages is not None:
        summary['月龄统计'] = {
            '平均月龄': round(cow_ages.mean(), 1),
            '中位数月龄': round(cow_ages.median(), 1),
            '最小月龄': round(cow_ages.min(), 1),
            '最大月龄': round(cow_ages.max(), 1)
        }

    if parity_data is not None:
        cow_parity, parity_counts = parity_data
        summary['胎次统计'] = {
            '平均胎次': round(cow_parity.mean(), 1),
            '中位数胎次': cow_parity.median(),
            '最大胎次': cow_parity.max(),
            '第1胎牛数': parity_counts.get(1, 0),
            '第2胎牛数': parity_counts.get(2, 0),
            '第3胎及以上牛数': parity_counts[parity_counts.index >= 3].sum()
        }

    if mastitis_data is not None:
        cow_mastitis, _ = mastitis_data
        never_sick = (cow_mastitis['mastitis_count'] == 0).sum()
        ever_sick = (cow_mastitis['mastitis_count'] > 0).sum()

        summary['乳腺炎统计'] = {
            '总体检出率': f"{cow_mastitis['mastitis_rate'].mean():.1%}",
            '从未患病牛数': never_sick,
            '患过病牛数': ever_sick,
            '平均检测次数': round(cow_mastitis['total_tests'].mean(), 1),
            '平均患病次数': round(cow_mastitis['mastitis_count'].mean(), 1)
        }

    # 保存为CSV
    summary_df = pd.DataFrame([(k1, k2, v2) for k1, v1 in summary.items()
                              for k2, v2 in v1.items()],
                             columns=['分类', '指标', '数值'])
    summary_df.to_csv('cattle_summary_report.csv', index=False, encoding='utf-8-sig')

    # 保存详细的每头牛数据
    if mastitis_data is not None and cow_ages is not None and parity_data is not None:
        cow_mastitis, _ = mastitis_data
        cow_parity, _ = parity_data

        detailed_cow_data = pd.DataFrame({
            'cow_id': cow_mastitis.index,
            'age_months': cow_ages.reindex(cow_mastitis.index),
            'parity': cow_parity.reindex(cow_mastitis.index),
            'total_tests': cow_mastitis['total_tests'],
            'mastitis_count': cow_mastitis['mastitis_count'],
            'mastitis_rate': cow_mastitis['mastitis_rate']
        })

        detailed_cow_data.to_csv('detailed_cow_data.csv', index=False, encoding='utf-8-sig')
        print("详细奶牛数据已保存至 detailed_cow_data.csv")

    print("统计摘要已保存至 cattle_summary_report.csv")

def main():
    """主函数"""
    print("🐄 奶牛基础信息统计分析")
    print("="*80)

    # 文件路径 - 请修改为实际路径
    file_path = "F:/PythonProject/dataset/副本南京卫岗2024年DHI数据.xlsx"

    # 1. 加载数据
    df = load_and_prepare_data(file_path)
    if df is None:
        return

    # 2. 基础信息分析
    basic_info = analyze_cattle_basic_info(df)

    # 3. 月龄分析
    age_result = analyze_age_distribution(df)
    cow_ages = age_result[0] if age_result else None

    # 4. 胎次分析
    parity_result = analyze_parity_distribution(df)
    parity_data = parity_result if parity_result else None

    # 5. 乳腺炎分析
    mastitis_result = analyze_mastitis_distribution(df)
    mastitis_data = mastitis_result if mastitis_result else None

    # 6. 生产性能分析
    production_data = analyze_production_performance(df)

    # 7. 创建可视化
    create_visualizations(df, cow_ages,
                         parity_data[1] if parity_data else None,
                         mastitis_data)

    # 8. 保存详细报告
    save_detailed_summary(basic_info, cow_ages, parity_data,
                         mastitis_data, production_data)

    # 9. 总结
    print("\n" + "="*80)
    print("📋 分析完成总结")
    print("="*80)
    print("✅ 奶牛基础信息统计分析完成")
    print("📁 生成文件:")
    print("   • cattle_basic_analysis.png - 基础信息可视化图表")
    print("   • cattle_summary_report.csv - 统计摘要报告")
    print("   • detailed_cow_data.csv - 详细奶牛数据")

if __name__ == "__main__":
    main()