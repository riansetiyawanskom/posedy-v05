
-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Permissions table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Role <-> Permissions (Many-to-Many)
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. User <-> Roles (Many-to-Many)
CREATE TABLE public.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

-- 6. Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Security definer function: check_user_permission
CREATE OR REPLACE FUNCTION public.check_user_permission(target_user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = target_user_id
        AND p.slug = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id
        AND r.name = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. RLS Policies

-- Roles: readable by authenticated users
CREATE POLICY "Authenticated users can view roles"
ON public.roles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert roles"
ON public.roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permissions: readable by authenticated, manageable by admins
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert permissions"
ON public.permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update permissions"
ON public.permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete permissions"
ON public.permissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Role_permissions: readable by authenticated, manageable by admins
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert role_permissions"
ON public.role_permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update role_permissions"
ON public.role_permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete role_permissions"
ON public.role_permissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User_roles: users can view own, admins can manage all
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Seed default roles
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Full system access'),
    ('editor', 'Can create and edit content'),
    ('viewer', 'Read-only access');

-- 11. Seed default permissions
INSERT INTO public.permissions (slug, description) VALUES
    ('user:read', 'View user profiles'),
    ('user:write', 'Edit user profiles'),
    ('user:delete', 'Delete users'),
    ('post:create', 'Create posts'),
    ('post:read', 'Read posts'),
    ('post:update', 'Update posts'),
    ('post:delete', 'Delete posts'),
    ('role:manage', 'Manage roles and permissions');

-- 12. Assign all permissions to admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin';

-- Assign read/create/update permissions to editor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN ('post:create', 'post:read', 'post:update', 'user:read')
WHERE r.name = 'editor';

-- Assign read permissions to viewer
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.slug IN ('post:read', 'user:read')
WHERE r.name = 'viewer';
