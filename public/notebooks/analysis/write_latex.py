import pandas as pd

def get_latex_summary_table(df):
    """
    Index(['Dataset', 'ViT', 'Model', 'Avg. Pos.', 'MRR', 'Recall@1', 'Recall@3',
       'Recall@5', 'Recall@10', 'nDCG@3', 'nDCG@5', 'nDCG@10'],
      dtype='object')
    """


    metrics_rows = []
    for index, row in df.iterrows():
        avg_pos = row['Avg. Pos.']
        mrr = row['MRR']
        recall_1 = row['Recall@1']
        recall_3 = row['Recall@3']
        recall_5 = row['Recall@5']
        recall_10 = row['Recall@10']
        nDCG_3 = row['nDCG@3']
        nDCG_5 = row['nDCG@5']
        nDCG_10 = row['nDCG@10']
        metrics_rows.append(f"{avg_pos} & {mrr} & {recall_1} & {recall_3} & {recall_5} & {recall_10} & {nDCG_3} & {nDCG_5} & {nDCG_10}")


    return r"""
        \begin{table}[]
        \centering
        \resizebox{\columnwidth}{!}{%
        \begin{tabular}{|c|c|c|c|c|c|c|c|c|c|c|c|}
        \hline
        \textbf{Dataset} & \textbf{ViT} & \textbf{Model} & \textbf{Avg. Pos.} & \textbf{MRR} & \textbf{Recall@1} & \textbf{Recall@3} & \textbf{Recall@5} & \textbf{Recall@10} & \textbf{nDCG@3} & \textbf{nDCG@5} & \textbf{nDCG@10} \\ \hline
        \multirow{3}{*}{N/A} & B/32 & basic-mini & """ + metrics_rows[0] +  r""" \\ \cline{2-12} 
        & L/14 & basic-base & """ + metrics_rows[1] +  r""" \\ \cline{2-12} 
        & L/14@336px & basic-large & """ + metrics_rows[2] +  r""" \\ \hline
        cap-FR-1 & \multirow{2}{*}{L/14} & february\_finetuned & """ + metrics_rows[3] +  r""" \\ \cline{1-1} \cline{3-12} 
        cap-FR-2 \& ico-FR &  & march\_finetuned & """ + metrics_rows[4] +  r""" \\ \hline
        \multirow{3}{*}{cap-TRI \& ico-TRI} & B/32 & art-mini & """ + metrics_rows[5] +  r""" \\ \cline{2-12} 
        & L/14 & art-base & """ + metrics_rows[6] +  r""" \\ \cline{2-12} 
        & L/14@336px & art-large & """ + metrics_rows[7] +  r""" \\ \hline
        \end{tabular}%
        }
        \caption{Table containing the results of Benchmark XX (variant \textit{-YYYYY}) in LANG}
        \label{tab:table_benchmark_XX_YYYYY_LANG}
        \end{table}
    """

def get_benchmark_1_table(df):
    
    rows = []
    for index, row in df.iterrows():
        rows.append(f"{row['Benchmark variant']} & {row['Language']} & {row['Avg. Position']} & {row['MRR']} & {row['Recall@1']} & {row['Recall@3']} & {row['Recall@5']} & {row['Recall@10']} & {row['nDCG@3']} & {row['nDCG@5']} & {row['nDCG@10']} \\\\ \\hline")

    return r"""
        \begin{table}[h]
        \centering
        \resizebox{\columnwidth}{!}{%
        \begin{tabular}{|c|c|c|c|c|c|c|c|c|c|c|c|}
        \hline
        \textbf{Benchmark variant} & \textbf{Language} & \textbf{Avg. Position} & \textbf{MRR} & \textbf{Recall@1} & \textbf{Recall@3} & \textbf{Recall@5} & \textbf{Recall@10} & \textbf{nDCG@3} & \textbf{nDCG@5} & \textbf{nDCG@10} \\ \hline
        """ + "\n".join(rows) + r"""
        \end{tabular}%
        }
        \caption{Benchmark 1 results for XXXXXXXXXX}
        \label{tab:benchmark_1_XXXXXXXXXX}
        \end{table}
    """