-- Datasets table for metadata tracking
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    columns JSONB,
    schema JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Chats table for persistent history
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Policies for datasets
CREATE POLICY "Users can view their own datasets" ON public.datasets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own datasets" ON public.datasets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own datasets" ON public.datasets
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for chats
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity logs for "Mission Control"
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON public.user_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.user_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
