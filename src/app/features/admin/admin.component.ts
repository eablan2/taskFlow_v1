import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models';

interface UserForm {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  editingId: string | null = null;

  form: UserForm = { name: '', username: '', password: '', role: 'user' };

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.userService.users$.subscribe(users => (this.users = users));
  }

  get currentUserId(): string {
    return this.auth.currentUser?.id ?? '';
  }

  openCreate(): void {
    this.editingId = null;
    this.form = { name: '', username: '', password: '', role: 'user' };
    this.showModal = true;
  }

  openEdit(user: User): void {
    this.editingId = user.id;
    this.form = { name: user.name, username: user.username, password: '', role: user.role };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  save(): void {
    const { name, username, password, role } = this.form;
    if (!name.trim() || !username.trim()) {
      this.toast.show('Name and username are required.', 'error');
      return;
    }
    if (this.userService.isUsernameTaken(username.trim().toLowerCase(), this.editingId ?? undefined)) {
      this.toast.show('Username already taken.', 'error');
      return;
    }

    if (this.editingId) {
      const changes: Partial<Omit<User, 'id'>> = { name: name.trim(), username: username.trim().toLowerCase(), role };
      if (password) changes.password = password;
      this.userService.update(this.editingId, changes).subscribe(() => {
        this.toast.show('User updated.');
        this.closeModal();
      });
    } else {
      if (!password) { this.toast.show('Password is required.', 'error'); return; }
      this.userService.add({ name: name.trim(), username: username.trim().toLowerCase(), password, role }).subscribe(() => {
        this.toast.show('User added.');
        this.closeModal();
      });
    }
  }

  confirmDelete(user: User): void {
    if (!confirm(`Remove ${user.name} from the workspace?`)) return;
    this.userService.delete(user.id).subscribe(() => {
      this.toast.show('User removed.');
    });
  }
}
