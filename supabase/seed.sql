-- MLordle starter content. Safe to re-run (upserts on primary key).

-- ---------- stages ----------
insert into stages (id, name, canonical_order, description) values
  ('problem-framing',     'Problem Framing',      1,  'Define the task, success metric, and constraints.'),
  ('data-gathering',      'Data Gathering',       2,  'Collect or source the raw data.'),
  ('data-cleaning',       'Data Cleaning',        3,  'Handle missing values, outliers, and duplicates.'),
  ('data-labeling',       'Data Labeling',        4,  'Produce ground-truth labels for supervised learning.'),
  ('data-augmentation',   'Data Augmentation',    5,  'Expand the training set with label-preserving variants.'),
  ('feature-engineering', 'Feature Engineering',  6,  'Transform raw inputs into model-ready features.'),
  ('model-training',      'Model Training',       7,  'Fit the model and tune hyperparameters.'),
  ('evaluation',          'Evaluation',           8,  'Measure performance on held-out data.'),
  ('deployment',          'Deployment',           9,  'Ship the model to serve predictions.'),
  ('monitoring',          'Monitoring & Retraining', 10, 'Watch live behavior and refresh the model.')
on conflict (id) do update set
  name = excluded.name, canonical_order = excluded.canonical_order, description = excluded.description;

-- ---------- scenarios ----------
insert into scenarios (id, title, domain, description, ordered_stage_ids, decoy_stage_ids) values
  ('xray-pneumonia', 'Pneumonia Detection from Chest X-rays', 'Computer Vision',
   'Build a CNN that flags likely pneumonia in chest radiographs for radiologist triage.',
   '{problem-framing,data-gathering,data-labeling,data-augmentation,model-training,evaluation,deployment,monitoring}',
   '{feature-engineering}'),

  ('telecom-churn', 'Telecom Customer Churn Prediction', 'Tabular / Business',
   'Predict which subscribers will cancel next month from billing and usage records.',
   '{problem-framing,data-gathering,data-cleaning,feature-engineering,model-training,evaluation,deployment,monitoring}',
   '{data-labeling,data-augmentation}'),

  ('review-sentiment', 'Product Review Sentiment Analysis', 'NLP',
   'Classify customer reviews as positive / negative to power a dashboard.',
   '{problem-framing,data-gathering,data-cleaning,data-labeling,model-training,evaluation,deployment}',
   '{feature-engineering,data-augmentation}'),

  ('stream-recsys', 'Streaming Recommendation Engine', 'Recommender Systems',
   'Recommend titles to viewers based on watch history and metadata.',
   '{problem-framing,data-gathering,data-cleaning,feature-engineering,model-training,evaluation,deployment,monitoring}',
   '{data-augmentation}'),

  ('card-fraud', 'Credit Card Fraud Detection', 'Tabular / Risk',
   'Flag fraudulent transactions in real time on a highly imbalanced dataset.',
   '{problem-framing,data-gathering,data-cleaning,feature-engineering,model-training,evaluation,deployment,monitoring}',
   '{data-labeling}'),

  ('demand-forecast', 'Retail Demand Forecasting', 'Time Series',
   'Forecast per-store SKU demand to drive inventory ordering.',
   '{problem-framing,data-gathering,data-cleaning,feature-engineering,model-training,evaluation,deployment,monitoring}',
   '{data-labeling,data-augmentation}')
on conflict (id) do update set
  title = excluded.title, domain = excluded.domain, description = excluded.description,
  ordered_stage_ids = excluded.ordered_stage_ids, decoy_stage_ids = excluded.decoy_stage_ids;

-- ---------- techniques ----------
-- attributes: {modality, when_applied, type, needs_labels}
insert into techniques (id, name, stage_id, aliases, attributes) values
  ('mixup',           'MixUp',                    'data-augmentation', '{}',                 '{"modality":"image","when_applied":"train-time","type":"synthetic","needs_labels":true}'),
  ('cutout',          'Cutout',                   'data-augmentation', '{"random erasing"}', '{"modality":"image","when_applied":"train-time","type":"transform","needs_labels":false}'),
  ('random-crop',     'Random Crop & Flip',       'data-augmentation', '{"random crop"}',    '{"modality":"image","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('smote',           'SMOTE',                    'data-augmentation', '{}',                 '{"modality":"tabular","when_applied":"preprocessing","type":"synthetic","needs_labels":true}'),
  ('back-translation','Back-Translation',         'data-augmentation', '{}',                 '{"modality":"text","when_applied":"preprocessing","type":"synthetic","needs_labels":false}'),
  ('eda-nlp',         'Easy Data Augmentation',   'data-augmentation', '{"eda"}',            '{"modality":"text","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('spec-augment',    'SpecAugment',              'data-augmentation', '{}',                 '{"modality":"audio","when_applied":"train-time","type":"transform","needs_labels":false}'),

  ('knn-impute',      'KNN Imputation',           'data-cleaning', '{"knn imputation"}',     '{"modality":"tabular","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('iqr-outlier',     'IQR Outlier Removal',      'data-cleaning', '{}',                     '{"modality":"tabular","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('dedup',           'Deduplication',            'data-cleaning', '{}',                     '{"modality":"any","when_applied":"preprocessing","type":"transform","needs_labels":false}'),

  ('one-hot',         'One-Hot Encoding',         'feature-engineering', '{"onehot"}',       '{"modality":"tabular","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('target-encoding', 'Target Encoding',          'feature-engineering', '{"mean encoding"}','{"modality":"tabular","when_applied":"preprocessing","type":"transform","needs_labels":true}'),
  ('standard-scaling','Standardization',          'feature-engineering', '{"z-score","scaling"}','{"modality":"tabular","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('pca',             'PCA',                      'feature-engineering', '{"principal component analysis"}','{"modality":"tabular","when_applied":"preprocessing","type":"transform","needs_labels":false}'),
  ('tfidf',           'TF-IDF',                   'feature-engineering', '{"tf idf"}',       '{"modality":"text","when_applied":"preprocessing","type":"transform","needs_labels":false}'),

  ('dropout',         'Dropout',                  'model-training', '{}',                    '{"modality":"any","when_applied":"train-time","type":"regularization","needs_labels":false}'),
  ('batch-norm',      'Batch Normalization',      'model-training', '{"batchnorm"}',         '{"modality":"any","when_applied":"train-time","type":"architectural","needs_labels":false}'),
  ('early-stopping',  'Early Stopping',           'model-training', '{}',                    '{"modality":"any","when_applied":"train-time","type":"regularization","needs_labels":false}'),
  ('l2-reg',          'L2 Regularization',        'model-training', '{"weight decay","ridge"}','{"modality":"any","when_applied":"train-time","type":"regularization","needs_labels":false}'),
  ('lr-scheduling',   'Learning-Rate Scheduling', 'model-training', '{"lr schedule"}',       '{"modality":"any","when_applied":"train-time","type":"regularization","needs_labels":false}'),

  ('kfold',           'K-Fold Cross-Validation',  'evaluation', '{"cross validation","cv"}','{"modality":"any","when_applied":"post-training","type":"sampling","needs_labels":true}'),
  ('confusion-matrix','Confusion Matrix',         'evaluation', '{}',                        '{"modality":"any","when_applied":"post-training","type":"transform","needs_labels":true}'),
  ('roc-auc',         'ROC-AUC',                  'evaluation', '{"auc","roc"}',             '{"modality":"any","when_applied":"post-training","type":"transform","needs_labels":true}'),

  ('active-learning', 'Active Learning',          'data-labeling', '{}',                     '{"modality":"any","when_applied":"preprocessing","type":"sampling","needs_labels":true}'),
  ('weak-supervision','Weak Supervision',         'data-labeling', '{"snorkel"}',            '{"modality":"any","when_applied":"preprocessing","type":"synthetic","needs_labels":false}'),

  ('quantization',    'Quantization',             'deployment', '{"int8 quantization"}',     '{"modality":"any","when_applied":"inference","type":"transform","needs_labels":false}'),
  ('ab-testing',      'A/B Testing',              'deployment', '{"split testing"}',         '{"modality":"any","when_applied":"inference","type":"sampling","needs_labels":false}'),
  ('shadow-deploy',   'Shadow Deployment',        'deployment', '{"shadow mode"}',           '{"modality":"any","when_applied":"inference","type":"sampling","needs_labels":false}'),

  ('drift-detection', 'Drift Detection',          'monitoring', '{"psi"}',                   '{"modality":"any","when_applied":"inference","type":"transform","needs_labels":false}'),
  ('canary',          'Canary Release',           'monitoring', '{"canary deployment"}',     '{"modality":"any","when_applied":"inference","type":"sampling","needs_labels":false}')
on conflict (id) do update set
  name = excluded.name, stage_id = excluded.stage_id, aliases = excluded.aliases, attributes = excluded.attributes;

-- ---------- causes ----------
-- attributes: {lifecycle_stage, category} where category in (data, model, process, infra)
insert into causes (id, name, aliases, attributes) values
  ('overfitting',           'Overfitting',           '{}',                       '{"lifecycle_stage":"model-training","category":"model"}'),
  ('underfitting',          'Underfitting',          '{}',                       '{"lifecycle_stage":"model-training","category":"model"}'),
  ('data-drift',            'Data Drift',            '{"distribution shift","covariate shift"}', '{"lifecycle_stage":"monitoring","category":"data"}'),
  ('concept-drift',         'Concept Drift',         '{}',                       '{"lifecycle_stage":"monitoring","category":"data"}'),
  ('data-leakage',          'Data Leakage',          '{"target leakage","leakage"}', '{"lifecycle_stage":"feature-engineering","category":"process"}'),
  ('class-imbalance',       'Class Imbalance',       '{"imbalanced data"}',      '{"lifecycle_stage":"data-gathering","category":"data"}'),
  ('training-serving-skew', 'Training-Serving Skew', '{"train serve skew","serving skew"}', '{"lifecycle_stage":"deployment","category":"process"}'),
  ('label-noise',           'Label Noise',           '{"noisy labels"}',         '{"lifecycle_stage":"data-labeling","category":"data"}')
on conflict (id) do update set
  name = excluded.name, aliases = excluded.aliases, attributes = excluded.attributes;

-- ---------- symptoms ----------
insert into symptoms (id, description, cause_id, stage_id) values
  ('train-val-gap',   'The model reaches 99% accuracy on the training set but only 70% on validation.', 'overfitting', 'model-training'),
  ('slow-decay',      'Accuracy was great at launch but has steadily dropped over the past six weeks in production.', 'data-drift', 'monitoring'),
  ('offline-online-gap','Offline evaluation looks excellent, yet live predictions are systematically off the moment it ships.', 'training-serving-skew', 'deployment'),
  ('too-perfect-cv',  'A feature derived from the outcome makes cross-validation scores suspiciously perfect.', 'data-leakage', 'feature-engineering'),
  ('majority-class',  'The classifier predicts the majority class for almost everything yet still reports high accuracy.', 'class-imbalance', 'data-gathering'),
  ('ui-shift',        'After a UI change, user behavior shifted and the same inputs now map to different correct labels.', 'concept-drift', 'monitoring'),
  ('high-both-loss',  'Both training and validation loss plateau at a high value; the model never fits the data well.', 'underfitting', 'model-training'),
  ('annotator-disagree','Annotators disagreed frequently and a sizable fraction of ground-truth labels are simply wrong.', 'label-noise', 'data-labeling'),
  ('rare-positive',   'The fraud model flags almost nothing because positive cases are only 0.2% of the data.', 'class-imbalance', 'data-gathering'),
  ('preproc-mismatch','A feature is scaled one way in the training pipeline and a different way in the serving code.', 'training-serving-skew', 'deployment')
on conflict (id) do update set
  description = excluded.description, cause_id = excluded.cause_id, stage_id = excluded.stage_id;
