import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import warnings
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import (RandomForestClassifier, AdaBoostClassifier,
                              GradientBoostingClassifier)
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import (accuracy_score, f1_score, roc_auc_score, roc_curve,
                             confusion_matrix, matthews_corrcoef,
                             precision_score, recall_score,
                             precision_recall_curve, average_precision_score)
from sklearn.base import clone
from sklearn.utils import resample
from imblearn.over_sampling import SMOTE

warnings.filterwarnings('ignore')
plt.ioff()


# ============================================================================
# 数据处理
# ============================================================================

def load_data(file_path):
    """加载数据"""
    if file_path.endswith('.xlsx'):
        df = pd.read_excel(file_path)
    else:
        try:
            df = pd.read_csv(file_path, sep='\t', encoding='gbk')
        except:
            df = pd.read_csv(file_path, sep='\t', encoding='latin1')

    column_translation = {
        '胎次': 'parity', '月龄': 'month_age', '产奶量': 'milk_yield',
        '乳脂率': 'fat_percentage', '蛋白率': 'protein_percentage',
        '脂蛋比': 'fat_protein_ratio', '体细胞数': 'somatic_cell_count',
        '体细胞评分': 'somatic_cell_score', '尿素氮': 'urea_nitrogen',
        '校正奶': 'corrected_milk', '持续力': 'persistence', 'WHI': 'WHI',
        '高峰奶': 'peak_milk', '高峰日': 'peak_day', 'X305奶量': 'X305_milk',
        '乳腺炎': 'mastitis', '产犊季节': 'calving_season', '检测季节': 'test_season'
    }

    df = df.rename(columns=column_translation)
    print(f"数据加载完成: {df.shape}")
    return df


def preprocess_data(df, safe_mode=True):
    """数据预处理"""
    print("\n" + "=" * 60)
    print("数据预处理")
    print("=" * 60)

    if 'somatic_cell_score' in df.columns:
        df['mastitis'] = (df['somatic_cell_score'] >= 4).astype(int)
        print(f"基于体细胞评分创建乳腺炎标签 (阈值>=4)")
    elif 'somatic_cell_count' in df.columns:
        df['mastitis'] = (df['somatic_cell_count'] >= 200000).astype(int)
        print(f"基于体细胞数创建乳腺炎标签 (阈值>=200,000)")
    else:
        print("未找到体细胞相关列")
        return None

    print(f"乳腺炎样本分布:\n{df['mastitis'].value_counts()}")
    print(f"乳腺炎比例: {df['mastitis'].mean():.3f}")

    leak_features = ['somatic_cell_score', 'somatic_cell_count', 'scs', 'SCS', 'scc', 'SCC']
    if safe_mode:
        additional_risky = ['corrected_milk', 'fat_protein_ratio', 'urea_nitrogen', 'persistence', 'WHI']
        leak_features.extend(additional_risky)

    cols_to_drop = [col for col in leak_features if col in df.columns]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        print(f"移除泄露特征: {cols_to_drop}")

    if safe_mode:
        safe_features = ['parity', 'month_age', 'milk_yield', 'fat_percentage',
                         'protein_percentage', 'peak_milk', 'peak_day', 'X305_milk',
                         'calving_season', 'test_season', 'mastitis']
        available = [col for col in safe_features if col in df.columns]
        df = df[available]

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    if 'mastitis' in numeric_cols:
        numeric_cols.remove('mastitis')

    if numeric_cols:
        imputer = SimpleImputer(strategy='median')
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
        scaler = StandardScaler()
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

    return df


def get_models():
    """返回所有模型"""
    return {
        'RandomForest': RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1),
        'DecisionTree': DecisionTreeClassifier(random_state=42),
        'GradientBoosting': GradientBoostingClassifier(random_state=42),
        'MLPClassifier': MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=1000, random_state=42),
        'AdaBoost': AdaBoostClassifier(random_state=42),
        'SVM': SVC(probability=True, random_state=42),
        'LogisticRegression': LogisticRegression(random_state=42, max_iter=1000),
        'LDA': LinearDiscriminantAnalysis(),
        'NaiveBayes': GaussianNB(),
    }


# ============================================================================
# 特征选择和重要性分析
# ============================================================================

def get_feature_importance(X, y):
    """获取特征重要性"""
    rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    rf.fit(X, y)

    importance_df = pd.DataFrame({
        'feature': X.columns,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)

    return importance_df, rf


def bootstrap_feature_importance(X, y, n_bootstrap=100):
    """Bootstrap验证特征重要性稳定性"""
    importance_matrix = []

    print(f"\nBootstrap特征重要性分析 ({n_bootstrap}次)...")

    for i in range(n_bootstrap):
        # Bootstrap采样
        X_boot, y_boot = resample(X, y, random_state=i)

        # 训练RF
        rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        rf.fit(X_boot, y_boot)

        importance_matrix.append(rf.feature_importances_)

        if (i + 1) % 20 == 0:
            print(f"  完成 {i + 1}/{n_bootstrap}")

    importance_matrix = np.array(importance_matrix)

    # 计算均值、标准差、CV
    means = importance_matrix.mean(axis=0)
    stds = importance_matrix.std(axis=0)
    cvs = stds / means  # 变异系数

    result_df = pd.DataFrame({
        'feature': X.columns,
        'importance_mean': means,
        'importance_std': stds,
        'cv': cvs
    }).sort_values('importance_mean', ascending=False)

    return result_df, importance_matrix


# ============================================================================
# 模型评估
# ============================================================================

def evaluate_cv_no_smote(model, X, y, n_splits=10, model_name=None):
    """CV without SMOTE - 基线方法"""
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    all_metrics = {
        'sensitivity': [], 'specificity': [], 'accuracy': [],
        'precision': [], 'f1': [], 'mcc': [], 'auc': [], 'pr_auc': []
    }

    all_y_true = []
    all_y_pred = []
    all_y_proba = []

    for fold, (train_idx, val_idx) in enumerate(cv.split(X, y), 1):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        # 不使用SMOTE，直接训练
        model_clone = clone(model)
        model_clone.fit(X_train, y_train)

        y_pred = model_clone.predict(X_val)

        if hasattr(model_clone, 'predict_proba'):
            y_proba = model_clone.predict_proba(X_val)[:, 1]
        elif hasattr(model_clone, 'decision_function'):
            y_proba = 1 / (1 + np.exp(-model_clone.decision_function(X_val)))
        else:
            y_proba = y_pred.astype(float)

        all_y_true.extend(y_val.values)
        all_y_pred.extend(y_pred)
        all_y_proba.extend(y_proba)

        tn, fp, fn, tp = confusion_matrix(y_val, y_pred).ravel()

        all_metrics['sensitivity'].append(recall_score(y_val, y_pred, zero_division=0))
        all_metrics['specificity'].append(tn / (tn + fp) if (tn + fp) > 0 else 0)
        all_metrics['accuracy'].append(accuracy_score(y_val, y_pred))
        all_metrics['precision'].append(precision_score(y_val, y_pred, zero_division=0))
        all_metrics['f1'].append(f1_score(y_val, y_pred, zero_division=0))
        all_metrics['mcc'].append(matthews_corrcoef(y_val, y_pred))

        try:
            all_metrics['auc'].append(roc_auc_score(y_val, y_proba))
            all_metrics['pr_auc'].append(average_precision_score(y_val, y_proba))
        except:
            all_metrics['auc'].append(0.5)
            all_metrics['pr_auc'].append(0.5)

    results = {metric: {'mean': np.mean(vals), 'std': np.std(vals), 'values': vals}
               for metric, vals in all_metrics.items()}

    predictions = {
        'y_true': np.array(all_y_true),
        'y_pred': np.array(all_y_pred),
        'y_proba': np.array(all_y_proba)
    }

    print(f"[CV-NoSMOTE] {model_name}: F1={results['f1']['mean']:.3f}±{results['f1']['std']:.3f}, "
          f"AUC={results['auc']['mean']:.3f}±{results['auc']['std']:.3f}")

    return results, predictions


def evaluate_cv_correct_method(model, X, y, n_splits=10, model_name=None):
    """SMOTE在每折内部应用"""
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    all_metrics = {
        'sensitivity': [], 'specificity': [], 'accuracy': [],
        'precision': [], 'f1': [], 'mcc': [], 'auc': [], 'pr_auc': []
    }

    all_y_true = []
    all_y_pred = []
    all_y_proba = []

    for fold, (train_idx, val_idx) in enumerate(cv.split(X, y), 1):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        # SMOTE只在训练折应用
        try:
            smote = SMOTE(random_state=42)
            X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
        except:
            X_train_smote, y_train_smote = X_train, y_train

        model_clone = clone(model)
        model_clone.fit(X_train_smote, y_train_smote)

        y_pred = model_clone.predict(X_val)

        if hasattr(model_clone, 'predict_proba'):
            y_proba = model_clone.predict_proba(X_val)[:, 1]
        elif hasattr(model_clone, 'decision_function'):
            y_proba = 1 / (1 + np.exp(-model_clone.decision_function(X_val)))
        else:
            y_proba = y_pred.astype(float)

        all_y_true.extend(y_val.values)
        all_y_pred.extend(y_pred)
        all_y_proba.extend(y_proba)

        tn, fp, fn, tp = confusion_matrix(y_val, y_pred).ravel()

        all_metrics['sensitivity'].append(recall_score(y_val, y_pred, zero_division=0))
        all_metrics['specificity'].append(tn / (tn + fp) if (tn + fp) > 0 else 0)
        all_metrics['accuracy'].append(accuracy_score(y_val, y_pred))
        all_metrics['precision'].append(precision_score(y_val, y_pred, zero_division=0))
        all_metrics['f1'].append(f1_score(y_val, y_pred, zero_division=0))
        all_metrics['mcc'].append(matthews_corrcoef(y_val, y_pred))

        try:
            all_metrics['auc'].append(roc_auc_score(y_val, y_proba))
            all_metrics['pr_auc'].append(average_precision_score(y_val, y_proba))
        except:
            all_metrics['auc'].append(0.5)
            all_metrics['pr_auc'].append(0.5)

    results = {metric: {'mean': np.mean(vals), 'std': np.std(vals), 'values': vals}
               for metric, vals in all_metrics.items()}

    predictions = {
        'y_true': np.array(all_y_true),
        'y_pred': np.array(all_y_pred),
        'y_proba': np.array(all_y_proba)
    }

    print(f"[CV] {model_name}: F1={results['f1']['mean']:.3f}±{results['f1']['std']:.3f}, "
          f"AUC={results['auc']['mean']:.3f}±{results['auc']['std']:.3f}")

    return results, predictions


def evaluate_on_test_set(model, X_train, y_train, X_test, y_test, model_name=None):
    """测试集评估"""
    try:
        smote = SMOTE(random_state=42)
        X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    except:
        X_train_smote, y_train_smote = X_train, y_train

    model_clone = clone(model)
    model_clone.fit(X_train_smote, y_train_smote)

    y_pred = model_clone.predict(X_test)

    if hasattr(model_clone, 'predict_proba'):
        y_proba = model_clone.predict_proba(X_test)[:, 1]
    elif hasattr(model_clone, 'decision_function'):
        y_proba = 1 / (1 + np.exp(-model_clone.decision_function(X_test)))
    else:
        y_proba = y_pred.astype(float)

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    results = {
        'sensitivity': recall_score(y_test, y_pred, zero_division=0),
        'specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'f1': f1_score(y_test, y_pred, zero_division=0),
        'mcc': matthews_corrcoef(y_test, y_pred),
        'auc': roc_auc_score(y_test, y_proba) if len(np.unique(y_test)) > 1 else 0.5,
        'pr_auc': average_precision_score(y_test, y_proba) if len(np.unique(y_test)) > 1 else 0.5
    }

    predictions = {
        'y_true': np.array(y_test),
        'y_pred': np.array(y_pred),
        'y_proba': np.array(y_proba)
    }

    print(f"[Test] {model_name}: F1={results['f1']:.3f}, AUC={results['auc']:.3f}")

    return results, predictions, model_clone


def run_all_evaluations(X_train, y_train, X_test, y_test, selected_features):
    """运行所有评估"""
    print("\n" + "=" * 80)
    print("模型评估")
    print("=" * 80)

    X_train_sel = X_train[selected_features]
    X_test_sel = X_test[selected_features]

    models = get_models()

    cv_smote_results = {}
    cv_smote_predictions = {}
    cv_no_smote_results = {}
    cv_no_smote_predictions = {}
    test_results = {}
    test_predictions = {}
    trained_models = {}

    for name, model in models.items():
        print(f"\n--- {name} ---")

        # CV with SMOTE (within each fold)
        cv_res, cv_pred = evaluate_cv_correct_method(
            model, X_train_sel, y_train, n_splits=10, model_name=name
        )
        cv_smote_results[name] = cv_res
        cv_smote_predictions[name] = cv_pred

        # CV without SMOTE
        cv_no_res, cv_no_pred = evaluate_cv_no_smote(
            model, X_train_sel, y_train, n_splits=10, model_name=name
        )
        cv_no_smote_results[name] = cv_no_res
        cv_no_smote_predictions[name] = cv_no_pred

        # Test set
        test_res, test_pred, trained_model = evaluate_on_test_set(
            model, X_train_sel, y_train, X_test_sel, y_test, model_name=name
        )
        test_results[name] = test_res
        test_predictions[name] = test_pred
        trained_models[name] = trained_model

    return (cv_smote_results, cv_smote_predictions,
            cv_no_smote_results, cv_no_smote_predictions,
            test_results, test_predictions, trained_models)


# ============================================================================
# 图表生成 - 主要图表
# ============================================================================

def plot_figure2_feature_importance(importance_df, save_path='Figure2_feature_importance.svg'):
    """Figure 2: 特征重要性排名"""
    plt.figure(figsize=(10, 6))

    top_features = importance_df.head(10)

    colors = plt.cm.Blues(np.linspace(0.4, 0.8, len(top_features)))[::-1]

    bars = plt.barh(range(len(top_features)), top_features['importance'].values[::-1],
                    color=colors, edgecolor='navy', linewidth=0.5)

    plt.yticks(range(len(top_features)), top_features['feature'].values[::-1])
    plt.xlabel('Relative Importance', fontsize=12)
    plt.ylabel('Feature', fontsize=12)
    plt.title('Feature Importance Ranking (Random Forest)', fontsize=14, fontweight='bold')

    # 添加数值标签
    for i, (bar, val) in enumerate(zip(bars, top_features['importance'].values[::-1])):
        plt.text(bar.get_width() + 0.005, bar.get_y() + bar.get_height()/2,
                f'{val:.3f}', va='center', fontsize=9)

    plt.xlim(0, max(top_features['importance']) * 1.15)
    plt.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 2 已保存至 {save_path}")


def plot_figure3_forest_plot(cv_results, save_path='Figure3_forest_plot.svg'):
    """Figure 3: Forest plot - AUC with 95% CI"""
    plt.figure(figsize=(10, 8))

    # 按AUC排序
    sorted_results = sorted(cv_results.items(),
                           key=lambda x: x[1]['auc']['mean'], reverse=True)

    models = [x[0] for x in sorted_results]
    means = [x[1]['auc']['mean'] for x in sorted_results]
    stds = [x[1]['auc']['std'] for x in sorted_results]

    # 95% CI = mean ± 1.96 * std / sqrt(n), 这里n=10折
    ci_95 = [1.96 * std / np.sqrt(10) for std in stds]

    y_pos = range(len(models))

    # 绘制森林图
    plt.errorbar(means, y_pos, xerr=ci_95, fmt='o', color='navy',
                ecolor='steelblue', elinewidth=2, capsize=5, capthick=2,
                markersize=8)

    # 添加垂直参考线
    plt.axvline(x=0.5, color='gray', linestyle='--', linewidth=1, alpha=0.7, label='Random (AUC=0.5)')

    plt.yticks(y_pos, models)
    plt.xlabel('AUC (95% CI)', fontsize=12)
    plt.ylabel('Algorithm', fontsize=12)
    plt.title('Forest Plot: AUC with 95% Confidence Intervals\n(10-Fold Cross-Validation)',
              fontsize=12, fontweight='bold')

    # 添加数值标签
    for i, (mean, ci) in enumerate(zip(means, ci_95)):
        plt.text(mean + ci + 0.02, i, f'{mean:.3f} [{mean-ci:.3f}, {mean+ci:.3f}]',
                va='center', fontsize=9)

    plt.xlim(0.4, 1.0)
    plt.grid(axis='x', alpha=0.3)
    plt.legend(loc='lower right')
    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 3 已保存至 {save_path}")


def plot_figure4_bootstrap(bootstrap_df, importance_matrix, feature_names,
                           save_path='Figure4_bootstrap.svg'):
    """Figure 4: Bootstrap验证特征稳定性"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    top_n = 10
    top_features = bootstrap_df.head(top_n)

    # 左图：特征重要性分布（箱线图）
    ax1 = axes[0]

    # 获取top特征的索引
    feature_indices = [list(feature_names).index(f) for f in top_features['feature']]
    box_data = [importance_matrix[:, idx] for idx in feature_indices]

    bp = ax1.boxplot(box_data, vert=False, patch_artist=True)

    colors = plt.cm.Blues(np.linspace(0.4, 0.8, top_n))[::-1]
    for patch, color in zip(bp['boxes'], colors):
        patch.set_facecolor(color)

    ax1.set_yticklabels(top_features['feature'].values)
    ax1.set_xlabel('Feature Importance', fontsize=12)
    ax1.set_title('Feature Importance Distribution\n(100 Bootstrap Resamples)', fontweight='bold')
    ax1.grid(axis='x', alpha=0.3)

    # 右图：变异系数
    ax2 = axes[1]

    cv_values = top_features['cv'].values
    bars = ax2.barh(range(len(top_features)), cv_values[::-1],
                   color=plt.cm.Reds(np.linspace(0.3, 0.7, top_n))[::-1],
                   edgecolor='darkred', linewidth=0.5)

    ax2.set_yticks(range(len(top_features)))
    ax2.set_yticklabels(top_features['feature'].values[::-1])
    ax2.set_xlabel('Coefficient of Variation (CV)', fontsize=12)
    ax2.set_title('Feature Stability Analysis\n(Lower CV = More Stable)', fontweight='bold')

    # 添加数值标签
    for bar, cv in zip(bars, cv_values[::-1]):
        ax2.text(bar.get_width() + 0.001, bar.get_y() + bar.get_height()/2,
                f'{cv:.3f}', va='center', fontsize=9)

    ax2.grid(axis='x', alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 4 已保存至 {save_path}")


def plot_figure5_threshold(cv_predictions, save_path='Figure5_threshold.svg'):
    """Figure 5: 阈值分析"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    key_models = ['RandomForest', 'MLPClassifier', 'LogisticRegression', 'SVM']
    selected = {k: v for k, v in cv_predictions.items() if k in key_models}

    thresholds = np.linspace(0.1, 0.9, 17)
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']

    # 左图：F1 vs Threshold
    ax1 = axes[0]
    for i, (name, pred) in enumerate(selected.items()):
        f1_scores = []
        for thresh in thresholds:
            y_pred_t = (pred['y_proba'] >= thresh).astype(int)
            f1_scores.append(f1_score(pred['y_true'], y_pred_t, zero_division=0))

        ax1.plot(thresholds, f1_scores, 'o-', linewidth=2, markersize=4,
                 label=name, color=colors[i])

        max_idx = np.argmax(f1_scores)
        ax1.annotate(f'{f1_scores[max_idx]:.3f}',
                     xy=(thresholds[max_idx], f1_scores[max_idx]),
                     xytext=(5, 5), textcoords='offset points', fontsize=8)

    ax1.axvline(x=0.5, color='black', linestyle='--', alpha=0.7, label='Default Threshold')
    ax1.set_title('F1 Score vs Classification Threshold', fontweight='bold')
    ax1.set_xlabel('Classification Threshold')
    ax1.set_ylabel('F1 Score')
    ax1.legend(fontsize=9)
    ax1.grid(True, alpha=0.3)
    ax1.set_ylim(0, 1.0)

    # 右图：Precision-Recall
    ax2 = axes[1]
    for i, (name, pred) in enumerate(selected.items()):
        precision, recall, _ = precision_recall_curve(pred['y_true'], pred['y_proba'])
        ap = average_precision_score(pred['y_true'], pred['y_proba'])
        ax2.plot(recall, precision, lw=2, label=f'{name} (AP = {ap:.3f})',
                 color=colors[i])

    baseline = np.mean([p['y_true'].mean() for p in cv_predictions.values()])
    ax2.axhline(y=baseline, color='gray', linestyle='--', linewidth=2,
                label=f'Random (AP = {baseline:.3f})')

    ax2.set_title('Precision-Recall Curves', fontweight='bold')
    ax2.set_xlabel('Recall (Sensitivity)')
    ax2.set_ylabel('Precision')
    ax2.legend(fontsize=9)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim([0.0, 1.0])
    ax2.set_ylim([0.0, 1.05])

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 5 已保存至 {save_path}")


def plot_figure6_roc_cv(cv_predictions, save_path='Figure6_ROC_CV.svg'):
    """Figure 6: ROC曲线（CV）"""
    plt.figure(figsize=(10, 8))
    colors = plt.cm.tab10(np.linspace(0, 1, 10))

    auc_list = []
    for name, pred in cv_predictions.items():
        auc = roc_auc_score(pred['y_true'], pred['y_proba'])
        auc_list.append((name, auc, pred))

    auc_list.sort(key=lambda x: x[1], reverse=True)

    for i, (name, auc, pred) in enumerate(auc_list):
        fpr, tpr, _ = roc_curve(pred['y_true'], pred['y_proba'])
        plt.plot(fpr, tpr, lw=2.5, color=colors[i], label=f'{name} (AUC = {auc:.3f})')

    plt.plot([0, 1], [0, 1], 'k--', lw=2, alpha=0.7, label='Random (AUC = 0.500)')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=12)
    plt.ylabel('True Positive Rate', fontsize=12)
    plt.title('ROC Curves (10-Fold Cross-Validation, SMOTE within each fold)',
              fontsize=12, fontweight='bold')
    plt.legend(loc="lower right", fontsize=9)
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 6 已保存至 {save_path}")


def plot_figure7_roc_test(test_predictions, save_path='Figure7_ROC_test.svg'):
    """Figure 7: ROC曲线（测试集）"""
    plt.figure(figsize=(10, 8))
    colors = plt.cm.tab10(np.linspace(0, 1, 10))

    auc_list = []
    for name, pred in test_predictions.items():
        auc = roc_auc_score(pred['y_true'], pred['y_proba'])
        auc_list.append((name, auc, pred))

    auc_list.sort(key=lambda x: x[1], reverse=True)

    for i, (name, auc, pred) in enumerate(auc_list):
        fpr, tpr, _ = roc_curve(pred['y_true'], pred['y_proba'])
        plt.plot(fpr, tpr, lw=2.5, color=colors[i], label=f'{name} (AUC = {auc:.3f})')

    plt.plot([0, 1], [0, 1], 'k--', lw=2, alpha=0.7, label='Random (AUC = 0.500)')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=12)
    plt.ylabel('True Positive Rate', fontsize=12)
    plt.title('ROC Curves (Held-out Test Set, Original Imbalanced Distribution)',
              fontsize=12, fontweight='bold')
    plt.legend(loc="lower right", fontsize=9)
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 7 已保存至 {save_path}")


def plot_figure8_confidence(cv_predictions, save_path='Figure8_confidence.svg'):
    """Figure 8: 置信度分析"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    key_models = ['RandomForest', 'MLPClassifier', 'LogisticRegression']
    selected = {k: v for k, v in cv_predictions.items() if k in key_models}

    colors_map = {'RandomForest': '#1f77b4', 'MLPClassifier': '#ff7f0e',
                  'LogisticRegression': '#d62728'}

    ax1 = axes[0]
    for name, pred in selected.items():
        y_true = pred['y_true']
        y_proba = pred['y_proba']
        color = colors_map.get(name, '#333333')

        prob_healthy = y_proba[y_true == 0]
        prob_mastitis = y_proba[y_true == 1]

        ax1.hist(prob_healthy, bins=30, alpha=0.4, color=color, density=True,
                 label=f'{name} - Healthy')
        ax1.hist(prob_mastitis, bins=30, alpha=0.6, color=color, density=True,
                 histtype='step', linewidth=2, label=f'{name} - Mastitis')

    ax1.axvline(x=0.5, color='black', linestyle='--', linewidth=2, label='Threshold')
    ax1.set_xlabel('Predicted Probability', fontsize=12)
    ax1.set_ylabel('Density', fontsize=12)
    ax1.set_title('Prediction Probability Distribution by True Label', fontsize=11, fontweight='bold')
    ax1.legend(fontsize=8, loc='upper center')
    ax1.grid(True, alpha=0.3)

    ax2 = axes[1]
    rf_pred = cv_predictions.get('RandomForest', list(cv_predictions.values())[0])
    y_true = rf_pred['y_true']
    y_pred = rf_pred['y_pred']
    y_proba = rf_pred['y_proba']

    confidence = np.abs(y_proba - 0.5) * 2

    conf_bins = np.linspace(0, 1, 11)
    bin_centers = (conf_bins[:-1] + conf_bins[1:]) / 2
    accuracies = []
    sample_counts = []

    for i in range(len(conf_bins) - 1):
        mask = (confidence >= conf_bins[i]) & (confidence < conf_bins[i + 1])
        if np.sum(mask) > 0:
            acc = np.mean(y_true[mask] == y_pred[mask])
            count = np.sum(mask)
        else:
            acc = 0
            count = 0
        accuracies.append(acc)
        sample_counts.append(count)

    ax2_twin = ax2.twinx()
    ax2.bar(bin_centers, sample_counts, width=0.08, alpha=0.3, color='skyblue', label='Sample Count')
    ax2_twin.plot(bin_centers, accuracies, 'ro-', linewidth=2, markersize=8, label='Accuracy')

    ax2.set_xlabel('Prediction Confidence', fontsize=12)
    ax2.set_ylabel('Sample Count', fontsize=12, color='steelblue')
    ax2_twin.set_ylabel('Accuracy', fontsize=12, color='red')
    ax2.set_title('Confidence vs Accuracy (RandomForest)', fontsize=11, fontweight='bold')
    ax2.grid(True, alpha=0.3)

    valid_idx = [i for i, c in enumerate(sample_counts) if c > 0]
    if len(valid_idx) > 2:
        valid_conf = [bin_centers[i] for i in valid_idx]
        valid_acc = [accuracies[i] for i in valid_idx]
        corr = np.corrcoef(valid_conf, valid_acc)[0, 1]
        ax2.text(0.05, 0.95, f'r = {corr:.2f}', transform=ax2.transAxes,
                 fontsize=12, fontweight='bold', verticalalignment='top')

    lines1, labels1 = ax2.get_legend_handles_labels()
    lines2, labels2 = ax2_twin.get_legend_handles_labels()
    ax2.legend(lines1 + lines2, labels1 + labels2, loc='center right', fontsize=9)

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure 8 已保存至 {save_path}")


# ============================================================================
# 补充图表 - 测试集
# ============================================================================

def plot_supp_pr_curves_test(test_predictions, save_path='FigureS1_PR_test.svg'):
    """Supplementary: PR曲线（测试集）"""
    plt.figure(figsize=(10, 8))
    colors = plt.cm.tab10(np.linspace(0, 1, 10))

    ap_list = []
    for name, pred in test_predictions.items():
        ap = average_precision_score(pred['y_true'], pred['y_proba'])
        ap_list.append((name, ap, pred))

    ap_list.sort(key=lambda x: x[1], reverse=True)

    for i, (name, ap, pred) in enumerate(ap_list):
        precision, recall, _ = precision_recall_curve(pred['y_true'], pred['y_proba'])
        plt.plot(recall, precision, lw=2.5, color=colors[i], label=f'{name} (AP = {ap:.3f})')

    baseline = np.mean([p['y_true'].mean() for p in test_predictions.values()])
    plt.axhline(y=baseline, color='gray', linestyle='--', linewidth=2,
                label=f'Random (AP = {baseline:.3f})')

    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Recall', fontsize=12)
    plt.ylabel('Precision', fontsize=12)
    plt.title('Precision-Recall Curves (Held-out Test Set)', fontsize=12, fontweight='bold')
    plt.legend(loc="lower left", fontsize=9)
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure S1 已保存至 {save_path}")


def plot_supp_threshold_test(test_predictions, save_path='FigureS2_threshold_test.svg'):
    """Supplementary: 阈值分析（测试集）"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    key_models = ['RandomForest', 'MLPClassifier', 'LogisticRegression', 'SVM']
    selected = {k: v for k, v in test_predictions.items() if k in key_models}

    thresholds = np.linspace(0.1, 0.9, 17)
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']

    # 左图：F1 vs Threshold
    ax1 = axes[0]
    for i, (name, pred) in enumerate(selected.items()):
        f1_scores = []
        for thresh in thresholds:
            y_pred_t = (pred['y_proba'] >= thresh).astype(int)
            f1_scores.append(f1_score(pred['y_true'], y_pred_t, zero_division=0))

        ax1.plot(thresholds, f1_scores, 'o-', linewidth=2, markersize=4,
                 label=name, color=colors[i])

        max_idx = np.argmax(f1_scores)
        ax1.annotate(f'{f1_scores[max_idx]:.3f}',
                     xy=(thresholds[max_idx], f1_scores[max_idx]),
                     xytext=(5, 5), textcoords='offset points', fontsize=8)

    ax1.axvline(x=0.5, color='black', linestyle='--', alpha=0.7, label='Default Threshold')
    ax1.set_title('F1 Score vs Threshold (Test Set)', fontweight='bold')
    ax1.set_xlabel('Classification Threshold')
    ax1.set_ylabel('F1 Score')
    ax1.legend(fontsize=9)
    ax1.grid(True, alpha=0.3)
    ax1.set_ylim(0, 1.0)

    # 右图：Precision-Recall
    ax2 = axes[1]
    for i, (name, pred) in enumerate(selected.items()):
        precision, recall, _ = precision_recall_curve(pred['y_true'], pred['y_proba'])
        ap = average_precision_score(pred['y_true'], pred['y_proba'])
        ax2.plot(recall, precision, lw=2, label=f'{name} (AP = {ap:.3f})',
                 color=colors[i])

    baseline = np.mean([p['y_true'].mean() for p in test_predictions.values()])
    ax2.axhline(y=baseline, color='gray', linestyle='--', linewidth=2,
                label=f'Random (AP = {baseline:.3f})')

    ax2.set_title('Precision-Recall Curves (Test Set)', fontweight='bold')
    ax2.set_xlabel('Recall')
    ax2.set_ylabel('Precision')
    ax2.legend(fontsize=9)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim([0.0, 1.0])
    ax2.set_ylim([0.0, 1.05])

    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure S2 已保存至 {save_path}")


def plot_supp_confusion_matrices(test_predictions, save_path='FigureS3_confusion_matrices.svg'):
    """Supplementary: 混淆矩阵（测试集）"""
    key_models = ['RandomForest', 'GradientBoosting', 'MLPClassifier', 'LogisticRegression']
    selected = {k: v for k, v in test_predictions.items() if k in key_models}

    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    axes = axes.flatten()

    for idx, (name, pred) in enumerate(selected.items()):
        ax = axes[idx]

        cm = confusion_matrix(pred['y_true'], pred['y_pred'])

        # 归一化
        cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

        im = ax.imshow(cm_norm, interpolation='nearest', cmap='Blues', vmin=0, vmax=1)

        # 添加数值
        for i in range(2):
            for j in range(2):
                text = f'{cm[i, j]}\n({cm_norm[i, j]:.1%})'
                ax.text(j, i, text, ha='center', va='center', fontsize=11,
                       color='white' if cm_norm[i, j] > 0.5 else 'black')

        ax.set_xticks([0, 1])
        ax.set_yticks([0, 1])
        ax.set_xticklabels(['Healthy', 'Mastitis'])
        ax.set_yticklabels(['Healthy', 'Mastitis'])
        ax.set_xlabel('Predicted', fontsize=11)
        ax.set_ylabel('Actual', fontsize=11)
        ax.set_title(f'{name}', fontsize=12, fontweight='bold')

    plt.suptitle('Confusion Matrices (Test Set, Threshold = 0.5)', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure S3 已保存至 {save_path}")


def plot_supp_forest_plot_test(test_results, save_path='FigureS4_forest_plot_test.svg'):
    """Supplementary: Forest plot（测试集）"""
    plt.figure(figsize=(10, 8))

    sorted_results = sorted(test_results.items(),
                           key=lambda x: x[1]['auc'], reverse=True)

    models = [x[0] for x in sorted_results]
    aucs = [x[1]['auc'] for x in sorted_results]
    pr_aucs = [x[1]['pr_auc'] for x in sorted_results]

    y_pos = np.arange(len(models))

    plt.barh(y_pos - 0.2, aucs, height=0.35, label='AUC', color='steelblue', edgecolor='navy')
    plt.barh(y_pos + 0.2, pr_aucs, height=0.35, label='PR-AUC', color='coral', edgecolor='darkred')

    plt.axvline(x=0.5, color='gray', linestyle='--', linewidth=1, alpha=0.7)

    plt.yticks(y_pos, models)
    plt.xlabel('Score', fontsize=12)
    plt.ylabel('Algorithm', fontsize=12)
    plt.title('AUC and PR-AUC Comparison (Test Set)', fontsize=12, fontweight='bold')
    plt.legend(loc='lower right')

    # 添加数值
    for i, (auc, pr_auc) in enumerate(zip(aucs, pr_aucs)):
        plt.text(auc + 0.01, i - 0.2, f'{auc:.3f}', va='center', fontsize=9)
        plt.text(pr_auc + 0.01, i + 0.2, f'{pr_auc:.3f}', va='center', fontsize=9)

    plt.xlim(0, 1.0)
    plt.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, format='svg', dpi=600, bbox_inches='tight')
    plt.close()
    print(f"Figure S4 已保存至 {save_path}")


# ============================================================================
# 表格生成
# ============================================================================

def print_table2(cv_results, save_path='Table2_CV_SMOTE.csv'):
    """Table 2: CV with SMOTE结果"""
    print("\n" + "=" * 150)
    print("Table 2: Cross-validation with SMOTE applied within each fold (threshold = 0.5)")
    print("=" * 150)

    sorted_models = sorted(cv_results.items(), key=lambda x: x[1]['auc']['mean'], reverse=True)

    data = []
    for name, res in sorted_models:
        row_data = {'Model': name}
        for metric in ['sensitivity', 'specificity', 'accuracy', 'precision', 'f1', 'mcc', 'auc', 'pr_auc']:
            mean = res[metric]['mean']
            std = res[metric]['std']
            row_data[metric] = f"{mean:.3f} ± {std:.3f}"
        data.append(row_data)
        print(f"{name:<20} F1={res['f1']['mean']:.3f}±{res['f1']['std']:.3f}  "
              f"AUC={res['auc']['mean']:.3f}±{res['auc']['std']:.3f}  "
              f"PR-AUC={res['pr_auc']['mean']:.3f}±{res['pr_auc']['std']:.3f}")

    pd.DataFrame(data).to_csv(save_path, index=False)
    print(f"\nTable 2 已保存至 {save_path}")


def print_table3(cv_results, save_path='Table3_CV_NoSMOTE.csv'):
    """Table 3: CV without SMOTE结果"""
    print("\n" + "=" * 150)
    print("Table 3: Cross-validation without SMOTE (threshold = 0.5)")
    print("=" * 150)

    sorted_models = sorted(cv_results.items(), key=lambda x: x[1]['auc']['mean'], reverse=True)

    data = []
    for name, res in sorted_models:
        row_data = {'Model': name}
        for metric in ['sensitivity', 'specificity', 'accuracy', 'precision', 'f1', 'mcc', 'auc', 'pr_auc']:
            mean = res[metric]['mean']
            std = res[metric]['std']
            row_data[metric] = f"{mean:.3f} ± {std:.3f}"
        data.append(row_data)
        print(f"{name:<20} F1={res['f1']['mean']:.3f}±{res['f1']['std']:.3f}  "
              f"AUC={res['auc']['mean']:.3f}±{res['auc']['std']:.3f}  "
              f"PR-AUC={res['pr_auc']['mean']:.3f}±{res['pr_auc']['std']:.3f}")

    pd.DataFrame(data).to_csv(save_path, index=False)
    print(f"\nTable 3 已保存至 {save_path}")


def print_table4(test_results, save_path='Table4_test_results.csv'):
    """Table 4: 测试集结果"""
    print("\n" + "=" * 150)
    print("Table 4: Test set performance (original imbalanced distribution, threshold = 0.5)")
    print("=" * 150)

    sorted_models = sorted(test_results.items(), key=lambda x: x[1]['auc'], reverse=True)

    data = []
    for name, res in sorted_models:
        row_data = {'Model': name}
        for metric in ['sensitivity', 'specificity', 'accuracy', 'precision', 'f1', 'mcc', 'auc', 'pr_auc']:
            row_data[metric] = f"{res[metric]:.3f}"
        data.append(row_data)
        print(f"{name:<20} F1={res['f1']:.3f}  AUC={res['auc']:.3f}  PR-AUC={res['pr_auc']:.3f}")

    pd.DataFrame(data).to_csv(save_path, index=False)
    print(f"\nTable 4 已保存至 {save_path}")


# ============================================================================
# 主函数
# ============================================================================

def main():
    print("=" * 80)
    print("奶牛乳腺炎预测模型 - 完整修正版")
    print("=" * 80)

    # 1. 加载数据
    file_path = "/home/mc02229/cow_mastitis/dataset/副本南京卫岗2024年DHI数据.xlsx"
    df = load_data(file_path)

    # 2. 预处理
    df = preprocess_data(df, safe_mode=True)
    if df is None:
        return

    # 3. 准备数据
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    features = [col for col in numeric_cols if col != 'mastitis']

    X = df[features]
    y = df['mastitis']

    print(f"\n数据: {len(X)} 样本, 乳腺炎比例: {y.mean():.3f}")

    # 4. 划分数据
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"训练集: {len(X_train)}, 测试集: {len(X_test)}")

    # 5. 特征重要性分析
    print("\n" + "=" * 60)
    print("特征重要性分析")
    print("=" * 60)
    importance_df, rf_model = get_feature_importance(X_train, y_train)
    print(importance_df)

    # Bootstrap分析
    bootstrap_df, importance_matrix = bootstrap_feature_importance(X_train, y_train, n_bootstrap=100)

    # 特征选择
    selected_features = importance_df.head(10)['feature'].tolist()
    print(f"\n选择的特征: {selected_features}")

    # 6. 模型评估
    (cv_smote_results, cv_smote_predictions,
     cv_no_smote_results, cv_no_smote_predictions,
     test_results, test_predictions, trained_models) = \
        run_all_evaluations(X_train, y_train, X_test, y_test, selected_features)

    # 7. 生成表格
    print_table2(cv_smote_results, 'Table2_CV_SMOTE.csv')
    print_table3(cv_no_smote_results, 'Table3_CV_NoSMOTE.csv')
    print_table4(test_results, 'Table4_test_results.csv')

    # 8. 生成主要图表 (使用CV with SMOTE的结果)
    print("\n" + "=" * 60)
    print("生成主要图表")
    print("=" * 60)

    plot_figure2_feature_importance(importance_df, 'Figure2_feature_importance.svg')
    plot_figure3_forest_plot(cv_smote_results, 'Figure3_forest_plot.svg')
    plot_figure4_bootstrap(bootstrap_df, importance_matrix, X_train.columns, 'Figure4_bootstrap.svg')
    plot_figure5_threshold(cv_smote_predictions, 'Figure5_threshold.svg')
    plot_figure6_roc_cv(cv_smote_predictions, 'Figure6_ROC_CV.svg')
    plot_figure7_roc_test(test_predictions, 'Figure7_ROC_test.svg')
    plot_figure8_confidence(cv_smote_predictions, 'Figure8_confidence.svg')

    # 9. 生成补充图表
    print("\n" + "=" * 60)
    print("生成补充图表")
    print("=" * 60)

    plot_supp_pr_curves_test(test_predictions, 'FigureS1_PR_test.svg')
    plot_supp_threshold_test(test_predictions, 'FigureS2_threshold_test.svg')
    plot_supp_confusion_matrices(test_predictions, 'FigureS3_confusion_matrices.svg')
    plot_supp_forest_plot_test(test_results, 'FigureS4_forest_plot_test.svg')

    # 10. 总结
    print("\n" + "=" * 80)
    print("完成！")
    print("=" * 80)

    print("\n表格:")
    print("  - Table2_CV_SMOTE.csv      (CV with SMOTE within each fold)")
    print("  - Table3_CV_NoSMOTE.csv    (CV without SMOTE)")
    print("  - Table4_test_results.csv  (Test set)")

    print("\n主要图表:")
    print("  - Figure2_feature_importance.svg")
    print("  - Figure3_forest_plot.svg")
    print("  - Figure4_bootstrap.svg")
    print("  - Figure5_threshold.svg")
    print("  - Figure6_ROC_CV.svg")
    print("  - Figure7_ROC_test.svg")
    print("  - Figure8_confidence.svg")

    print("\n补充图表:")
    print("  - FigureS1_PR_test.svg")
    print("  - FigureS2_threshold_test.svg")
    print("  - FigureS3_confusion_matrices.svg")
    print("  - FigureS4_forest_plot_test.svg")

    # 打印结果对比
    print("\n" + "=" * 80)
    print("Random Forest 结果对比")
    print("=" * 80)
    rf_smote = cv_smote_results['RandomForest']
    rf_no_smote = cv_no_smote_results['RandomForest']
    rf_test = test_results['RandomForest']

    print(f"\n{'指标':<12} {'CV+SMOTE':<20} {'CV无SMOTE':<20} {'Test':<15}")
    print("-" * 70)
    print(f"{'AUC':<12} {rf_smote['auc']['mean']:.3f}±{rf_smote['auc']['std']:.3f}         "
          f"{rf_no_smote['auc']['mean']:.3f}±{rf_no_smote['auc']['std']:.3f}         "
          f"{rf_test['auc']:.3f}")
    print(f"{'F1':<12} {rf_smote['f1']['mean']:.3f}±{rf_smote['f1']['std']:.3f}         "
          f"{rf_no_smote['f1']['mean']:.3f}±{rf_no_smote['f1']['std']:.3f}         "
          f"{rf_test['f1']:.3f}")
    print(f"{'PR-AUC':<12} {rf_smote['pr_auc']['mean']:.3f}±{rf_smote['pr_auc']['std']:.3f}         "
          f"{rf_no_smote['pr_auc']['mean']:.3f}±{rf_no_smote['pr_auc']['std']:.3f}         "
          f"{rf_test['pr_auc']:.3f}")


if __name__ == "__main__":
    main()